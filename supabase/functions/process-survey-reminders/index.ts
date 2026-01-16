import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SurveyReminder {
  id: string
  token: string
  inscription_id: string
  student_id: string
  created_at: string
  reminder_1_sent_at: string | null
  reminder_2_sent_at: string | null
  student: {
    first_name: string
    last_name: string
    email: string
  }
  inscription: {
    language: string
    start_date: string
    end_date: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured - skipping email sending')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'RESEND_API_KEY not configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const now = new Date()
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Fetch incomplete surveys that need reminders
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
      reminder1Sent: 0,
      reminder2Sent: 0,
      errors: [] as string[]
    }

    const surveyUrl = Deno.env.get('SURVEY_BASE_URL') || 'https://id-preview--34e71e1a-49f7-433e-bb36-fc4d26e86f8e.lovable.app'

    for (const survey of surveys || []) {
      const student = (survey as any).students
      const inscription = (survey as any).inscriptions
      const createdAt = new Date(survey.created_at)

      if (!student?.email) continue

      try {
        // Check if J+5 reminder is needed
        if (!survey.reminder_1_sent_at && createdAt <= fiveDaysAgo) {
          await sendReminderEmail(
            resendApiKey,
            student.email,
            student.first_name,
            survey.token,
            surveyUrl,
            'first'
          )

          await supabase
            .from('satisfaction_surveys')
            .update({ reminder_1_sent_at: now.toISOString() })
            .eq('id', survey.id)

          results.reminder1Sent++
          console.log(`Sent J+5 reminder to ${student.email}`)
        }
        // Check if J+30 reminder is needed
        else if (
          survey.reminder_1_sent_at && 
          !survey.reminder_2_sent_at && 
          createdAt <= thirtyDaysAgo
        ) {
          await sendReminderEmail(
            resendApiKey,
            student.email,
            student.first_name,
            survey.token,
            surveyUrl,
            'second'
          )

          await supabase
            .from('satisfaction_surveys')
            .update({ reminder_2_sent_at: now.toISOString() })
            .eq('id', survey.id)

          results.reminder2Sent++
          console.log(`Sent J+30 reminder to ${student.email}`)
        }
      } catch (emailError) {
        const errorMsg = `Failed to send reminder to ${student.email}: ${emailError}`
        console.error(errorMsg)
        results.errors.push(errorMsg)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Sent ${results.reminder1Sent} J+5 reminders and ${results.reminder2Sent} J+30 reminders`
      }),
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

async function sendReminderEmail(
  apiKey: string,
  toEmail: string,
  firstName: string,
  token: string,
  baseUrl: string,
  reminderType: 'first' | 'second'
): Promise<void> {
  const surveyLink = `${baseUrl}/survey/${token}`
  
  const subject = reminderType === 'first'
    ? `Rappel : Votre avis nous intéresse - Questionnaire de satisfaction`
    : `Dernier rappel : N'oubliez pas de donner votre avis !`

  const body = reminderType === 'first'
    ? `
      <h2>Bonjour ${firstName},</h2>
      <p>Nous espérons que votre formation s'est bien passée !</p>
      <p>Nous n'avons pas encore reçu votre retour sur votre expérience de formation. Votre avis est précieux et nous aide à améliorer continuellement nos services.</p>
      <p>Le questionnaire ne prend que 2 minutes :</p>
      <p><a href="${surveyLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Donner mon avis</a></p>
      <p>Merci de votre confiance,<br>L'équipe FLI</p>
    `
    : `
      <h2>Bonjour ${firstName},</h2>
      <p>Ceci est notre dernier rappel concernant le questionnaire de satisfaction suite à votre formation.</p>
      <p>Votre retour d'expérience est essentiel pour nous permettre d'améliorer nos formations et répondre au mieux aux attentes de nos stagiaires.</p>
      <p>Le questionnaire ne prend que 2 minutes :</p>
      <p><a href="${surveyLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Donner mon avis maintenant</a></p>
      <p>Merci d'avance pour votre participation,<br>L'équipe FLI</p>
    `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FLI Formation <noreply@fli-formation.fr>',
      to: [toEmail],
      subject,
      html: body,
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Resend API error: ${errorData}`)
  }
}
