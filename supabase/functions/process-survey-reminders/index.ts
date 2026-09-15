import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendFliEmail } from '../_shared/fli-email.ts'
import { loadEmailTemplate, renderEmailTemplate } from '../_shared/email-model-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REMINDER_SLUGS = {
  1: 'satisfaction_survey_reminder_1',
  2: 'satisfaction_survey_reminder_2',
} as const

type ReminderLevel = 1 | 2

function formatDateFr(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const surveyBaseUrl = Deno.env.get('SURVEY_BASE_URL')
      || 'https://ski-linguist-hub.lovable.app'

    if (!dryRun && !resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "RESEND_API_KEY absente. Utilisez ?dry_run=true pour un essai sans envoi.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Point 8 : aucune relance ne part si son modèle n'est pas validé et actif.
    const templates = new Map<ReminderLevel, Awaited<ReturnType<typeof loadEmailTemplate>>>()
    for (const level of [1, 2] as ReminderLevel[]) {
      templates.set(level, await loadEmailTemplate(supabase, REMINDER_SLUGS[level]))
    }

    const missingTemplates = ([1, 2] as ReminderLevel[])
      .filter((level) => !templates.get(level))
      .map((level) => REMINDER_SLUGS[level])

    const now = new Date()
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { data: surveys, error } = await supabase
      .from('satisfaction_surveys')
      .select(`
        id,
        token,
        inscription_id,
        student_id,
        created_at,
        reminder_1_sent_at,
        reminder_2_sent_at,
        students!satisfaction_surveys_student_id_fkey (
          first_name,
          last_name,
          email
        ),
        inscriptions!satisfaction_surveys_inscription_id_fkey (
          language,
          start_date,
          end_date
        )
      `)
      .is('completed_at', null)

    if (error) {
      throw error
    }

    const results = {
      dryRun,
      missingTemplates,
      reminder1Sent: 0,
      reminder2Sent: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const survey of surveys || []) {
      const student = (survey as any).students
      const inscription = (survey as any).inscriptions
      const createdAt = new Date(survey.created_at)

      if (!student?.email) {
        results.skipped++
        continue
      }

      let level: ReminderLevel | null = null
      if (!survey.reminder_1_sent_at && createdAt <= fiveDaysAgo) {
        level = 1
      } else if (survey.reminder_1_sent_at && !survey.reminder_2_sent_at && createdAt <= thirtyDaysAgo) {
        level = 2
      }

      if (level === null) {
        results.skipped++
        continue
      }

      const template = templates.get(level)
      if (!template) {
        results.skipped++
        continue
      }

      const variables = {
        student_name: student.first_name || '',
        language: inscription?.language || '',
        end_date: formatDateFr(inscription?.end_date ?? null),
        survey_link: `${surveyBaseUrl}/survey/${survey.token}`,
      }

      if (dryRun) {
        if (level === 1) results.reminder1Sent++
        if (level === 2) results.reminder2Sent++
        continue
      }

      try {
        const rendered = renderEmailTemplate(template, variables)
        const outcome = await sendFliEmail({
          resendApiKey,
          to: student.email,
          subject: rendered.subject,
          html: rendered.html,
        })

        await supabase.from('email_log').insert({
          template_slug: REMINDER_SLUGS[level],
          recipient_email: student.email,
          recipient_name: `${student.first_name} ${student.last_name}`.trim(),
          inscription_id: survey.inscription_id,
          status: outcome.ok ? 'sent' : outcome.skipped ? 'skipped' : 'failed',
          error_message: outcome.error ?? null,
          variables_used: variables,
        })

        if (!outcome.ok) {
          results.errors.push(`Questionnaire ${survey.id}: ${outcome.error ?? 'envoi refusé'}`)
          continue
        }

        const column = `reminder_${level}_sent_at`
        await supabase
          .from('satisfaction_surveys')
          .update({ [column]: now.toISOString() })
          .eq('id', survey.id)

        if (level === 1) results.reminder1Sent++
        if (level === 2) results.reminder2Sent++
      } catch (emailError) {
        results.errors.push(`Questionnaire ${survey.id}: ${emailError}`)
      }
    }

    const summary = dryRun
      ? `[ESSAI] ${results.reminder1Sent} relances J+5 et ${results.reminder2Sent} relances J+30 prêtes`
      : `${results.reminder1Sent} relances J+5 et ${results.reminder2Sent} relances J+30 envoyées`

    return new Response(
      JSON.stringify({ success: true, results, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing survey reminders:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
