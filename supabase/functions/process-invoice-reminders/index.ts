import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendFliEmail } from '../_shared/fli-email.ts'
import { loadEmailTemplate, renderEmailTemplate } from '../_shared/email-model-templates.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const REMINDER_SLUGS = {
  1: 'invoice_reminder_1',
  2: 'invoice_reminder_2',
  3: 'invoice_reminder_3',
} as const

type ReminderLevel = 1 | 2 | 3

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDateFr(dateStr: string): string {
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

    console.log(`Starting invoice reminder processing (dry_run: ${dryRun})`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Point 8 : un niveau de relance ne part que si son modèle est validé et actif.
    const templates = new Map<ReminderLevel, Awaited<ReturnType<typeof loadEmailTemplate>>>()
    for (const level of [1, 2, 3] as ReminderLevel[]) {
      templates.set(level, await loadEmailTemplate(supabase, REMINDER_SLUGS[level]))
    }

    const missingTemplates = ([1, 2, 3] as ReminderLevel[])
      .filter((level) => !templates.get(level))
      .map((level) => REMINDER_SLUGS[level])

    if (!dryRun && !resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "RESEND_API_KEY absente. Utilisez ?dry_run=true pour un essai sans envoi.",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount_ht,
        amount_ttc,
        due_date,
        status,
        client_type,
        origin,
        reminder_1_sent_at,
        reminder_2_sent_at,
        reminder_3_sent_at,
        inscriptions!invoices_inscription_id_fkey (
          id,
          students!inscriptions_student_id_fkey (
            first_name,
            last_name,
            email
          ),
          partners!inscriptions_partner_id_fkey (
            name,
            contact_name,
            contact_email
          )
        )
      `)
      .lt('due_date', today)
      .in('status', ['draft', 'sent', 'en_attente', 'a_relancer'])
      .eq('origin', 'app')

    if (error) {
      throw error
    }

    const results = {
      dryRun,
      totalOverdue: invoices?.length || 0,
      missingTemplates,
      reminder1Sent: 0,
      reminder2Sent: 0,
      reminder3Sent: 0,
      skipped: 0,
      byRecipientType: {} as Record<string, number>,
      details: [] as Array<{
        invoiceNumber: string
        email: string
        daysOverdue: number
        reminderLevel: number | null
        action: string
      }>,
      errors: [] as string[],
    }

    for (const invoice of invoices || []) {
      const inscription = (invoice as any).inscriptions
      const student = inscription?.students
      const partner = inscription?.partners
      const clientType = (invoice as any).client_type || 'stagiaire'

      // Payeur = destinataire de facturation (jamais le stagiaire par défaut si école / partenaire).
      let payerEmail: string | null = null
      let payerName = ''
      if (clientType === 'ecole_ski' || clientType === 'dsf' || clientType === 'autre') {
        payerEmail = partner?.contact_email || null
        payerName = (partner?.contact_name || partner?.name || '').trim()
      }
      if (!payerEmail) {
        payerEmail = student?.email || null
        payerName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim()
      }

      if (!payerEmail) {
        results.skipped++
        results.details.push({
          invoiceNumber: invoice.invoice_number,
          email: 'N/A',
          daysOverdue: 0,
          reminderLevel: null,
          action: 'IGNOREE - aucune adresse payeur',
        })
        continue
      }

      const dueDate = new Date(invoice.due_date)
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      let level: ReminderLevel | null = null
      if (!invoice.reminder_1_sent_at && daysOverdue >= 7 && daysOverdue < 15) {
        level = 1
      } else if (invoice.reminder_1_sent_at && !invoice.reminder_2_sent_at && daysOverdue >= 15 && daysOverdue < 30) {
        level = 2
      } else if (invoice.reminder_2_sent_at && !invoice.reminder_3_sent_at && daysOverdue >= 30) {
        level = 3
      }

      if (level === null) {
        let reason = 'pas encore relançable'
        if (daysOverdue < 7) reason = `${daysOverdue} jours de retard (7 minimum)`
        else if (invoice.reminder_3_sent_at) reason = 'toutes les relances sont parties'
        else if (!invoice.reminder_1_sent_at && daysOverdue >= 15) reason = 'relance 1 jamais envoyée'
        else if (!invoice.reminder_2_sent_at && daysOverdue >= 30) reason = 'relance 2 jamais envoyée'

        results.skipped++
        results.details.push({
          invoiceNumber: invoice.invoice_number,
          email: payerEmail,
          daysOverdue,
          reminderLevel: null,
          action: `IGNOREE - ${reason}`,
        })
        continue
      }

      const template = templates.get(level)
      if (!template) {
        results.skipped++
        results.details.push({
          invoiceNumber: invoice.invoice_number,
          email: payerEmail,
          daysOverdue,
          reminderLevel: level,
          action: `IGNOREE - modèle ${REMINDER_SLUGS[level]} non validé`,
        })
        continue
      }

      const variables = {
        client_name: payerName || 'client',
        invoice_number: invoice.invoice_number,
        amount: formatAmount(invoice.amount_ttc || invoice.amount_ht),
        due_date: formatDateFr(invoice.due_date),
        days_overdue: String(daysOverdue),
      }

      if (dryRun) {
        results.details.push({
          invoiceNumber: invoice.invoice_number,
          email: payerEmail,
          daysOverdue,
          reminderLevel: level,
          action: `ESSAI - relance ${level} prête (${REMINDER_SLUGS[level]}) payeur=${clientType}`,
        })
        if (level === 1) results.reminder1Sent++
        if (level === 2) results.reminder2Sent++
        if (level === 3) results.reminder3Sent++
        results.byRecipientType[clientType] = (results.byRecipientType[clientType] || 0) + 1

        await supabase.from('email_log').insert({
          template_slug: REMINDER_SLUGS[level],
          recipient_email: payerEmail,
          recipient_name: variables.client_name,
          inscription_id: inscription?.id ?? null,
          status: 'dry_run',
          error_message: null,
          variables_used: { ...variables, client_type: clientType, dry_run: true },
        })
        continue
      }

      try {
        const rendered = renderEmailTemplate(template, variables)
        const outcome = await sendFliEmail({
          resendApiKey,
          to: payerEmail,
          subject: rendered.subject,
          html: rendered.html,
        })

        await supabase.from('email_log').insert({
          template_slug: REMINDER_SLUGS[level],
          recipient_email: payerEmail,
          recipient_name: variables.client_name,
          inscription_id: inscription?.id ?? null,
          status: outcome.ok ? 'sent' : outcome.skipped ? 'skipped' : 'failed',
          error_message: outcome.error ?? null,
          variables_used: { ...variables, client_type: clientType },
        })

        if (!outcome.ok) {
          results.errors.push(`Facture ${invoice.invoice_number}: ${outcome.error ?? 'envoi refusé'}`)
          continue
        }

        const column = `reminder_${level}_sent_at`
        await supabase
          .from('invoices')
          .update({ [column]: now.toISOString() })
          .eq('id', invoice.id)

        if (level === 1) results.reminder1Sent++
        if (level === 2) results.reminder2Sent++
        if (level === 3) results.reminder3Sent++
        results.byRecipientType[clientType] = (results.byRecipientType[clientType] || 0) + 1

        results.details.push({
          invoiceNumber: invoice.invoice_number,
          email: payerEmail,
          daysOverdue,
          reminderLevel: level,
          action: `ENVOYEE - relance ${level} (payeur ${clientType})`,
        })

        // BL-007 — notif BO facture échue
        try {
          const { data: adminUsers } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin')
          const title =
            level === 3
              ? `Mise en demeure — ${invoice.invoice_number}`
              : `Facture échue (relance ${level}) — ${invoice.invoice_number}`
          for (const admin of adminUsers || []) {
            await supabase.from('notifications').insert({
              user_id: admin.user_id,
              type: 'paiement',
              title,
              message: `${daysOverdue} j de retard · ${formatAmount(invoice.amount_ttc || invoice.amount_ht)}`,
              link: `/invoices?q=${encodeURIComponent(invoice.invoice_number || invoice.id)}`,
            })
          }
        } catch (notifError) {
          console.warn('Notification facture échue impossible:', notifError)
        }
      } catch (emailError) {
        results.errors.push(`Facture ${invoice.invoice_number}: ${emailError}`)
      }
    }

    const summary = dryRun
      ? `[ESSAI] ${results.reminder1Sent} premières, ${results.reminder2Sent} secondes, ${results.reminder3Sent} mises en demeure`
      : `${results.reminder1Sent} premières, ${results.reminder2Sent} secondes, ${results.reminder3Sent} mises en demeure`

    console.log(summary)

    // Récap observation (dry_run planifié) → info@fli.fr / ADMIN_EMAIL
    if (dryRun && resendApiKey) {
      const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'info@fli.fr'
      const recipientLines = Object.entries(results.byRecipientType)
        .map(([k, n]) => `<li>${k} : ${n}</li>`)
        .join('')
      const html = `
        <p>Récapitulatif simulation — <code>process-invoice-reminders</code></p>
        <ul>
          <li>invoice_reminder_1 : ${results.reminder1Sent}</li>
          <li>invoice_reminder_2 : ${results.reminder2Sent}</li>
          <li>invoice_reminder_3 : ${results.reminder3Sent}</li>
          <li>ignorés : ${results.skipped}</li>
          <li>périmètre : origin=app uniquement (import historique exclu)</li>
        </ul>
        <p>Par type de destinataire (client_type) :</p>
        <ul>${recipientLines || '<li>aucun</li>'}</ul>
        <p>${summary}</p>
      `
      try {
        await sendFliEmail({
          resendApiKey,
          to: adminEmail,
          subject: `[FLI][ESSAI] Relances facture — ${results.reminder1Sent + results.reminder2Sent + results.reminder3Sent} envoi(s) simulé(s)`,
          html,
        })
      } catch (recapError) {
        console.warn('Récap dry_run facture impossible:', recapError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, results, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing invoice reminders:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
