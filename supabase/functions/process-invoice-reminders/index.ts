import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OverdueInvoice {
  id: string
  invoice_number: string
  amount_ht: number
  amount_ttc: number | null
  due_date: string
  status: string
  reminder_1_sent_at: string | null
  reminder_2_sent_at: string | null
  reminder_3_sent_at: string | null
  inscription: {
    id: string
    student: {
      first_name: string
      last_name: string
      email: string
    }
  } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'
    
    console.log(`🚀 Starting invoice reminder processing... (dry_run: ${dryRun})`)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    // In dry-run mode, we don't need Resend API key
    if (!dryRun && !resendApiKey) {
      console.log('⚠️ RESEND_API_KEY not configured - skipping email sending')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'RESEND_API_KEY not configured. Use ?dry_run=true to test without sending emails.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Fetch overdue invoices (due_date < today and status not 'paid')
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        amount_ht,
        amount_ttc,
        due_date,
        status,
        reminder_1_sent_at,
        reminder_2_sent_at,
        reminder_3_sent_at,
        inscriptions!invoices_inscription_id_fkey (
          id,
          students!inscriptions_student_id_fkey (
            first_name,
            last_name,
            email
          )
        )
      `)
      .lt('due_date', today)
      .in('status', ['draft', 'sent'])

    if (error) {
      throw error
    }

    console.log(`📋 Found ${invoices?.length || 0} overdue invoices`)

    const results = {
      dryRun,
      totalOverdue: invoices?.length || 0,
      reminder1Sent: 0,
      reminder2Sent: 0,
      reminder3Sent: 0,
      skipped: 0,
      details: [] as Array<{
        invoiceNumber: string
        email: string
        daysOverdue: number
        reminderLevel: number | null
        action: string
      }>,
      errors: [] as string[]
    }

    for (const invoice of invoices || []) {
      const inscription = (invoice as any).inscriptions
      const student = inscription?.students
      
      if (!student?.email) {
        console.log(`⏭️ Skipping invoice ${invoice.invoice_number} - no student email found`)
        results.skipped++
        results.details.push({
          invoiceNumber: invoice.invoice_number,
          email: 'N/A',
          daysOverdue: 0,
          reminderLevel: null,
          action: 'SKIPPED - No email'
        })
        continue
      }

      const dueDate = new Date(invoice.due_date)
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      try {
        // Reminder 1: 7 days overdue
        if (!invoice.reminder_1_sent_at && daysOverdue >= 7 && daysOverdue < 15) {
          if (!dryRun && resendApiKey) {
            await sendReminderEmail(
              resendApiKey,
              student.email,
              student.first_name,
              invoice.invoice_number,
              invoice.amount_ttc || invoice.amount_ht,
              invoice.due_date,
              1
            )

            await supabase
              .from('invoices')
              .update({ reminder_1_sent_at: now.toISOString() })
              .eq('id', invoice.id)
          }

          results.reminder1Sent++
          results.details.push({
            invoiceNumber: invoice.invoice_number,
            email: student.email,
            daysOverdue,
            reminderLevel: 1,
            action: dryRun ? 'WOULD SEND Reminder 1' : 'SENT Reminder 1'
          })
          console.log(`📧 ${dryRun ? '[DRY-RUN]' : ''} Reminder 1 to ${student.email} for invoice ${invoice.invoice_number}`)
        }
        // Reminder 2: 15 days overdue
        else if (invoice.reminder_1_sent_at && !invoice.reminder_2_sent_at && daysOverdue >= 15 && daysOverdue < 30) {
          if (!dryRun && resendApiKey) {
            await sendReminderEmail(
              resendApiKey,
              student.email,
              student.first_name,
              invoice.invoice_number,
              invoice.amount_ttc || invoice.amount_ht,
              invoice.due_date,
              2
            )

            await supabase
              .from('invoices')
              .update({ reminder_2_sent_at: now.toISOString() })
              .eq('id', invoice.id)
          }

          results.reminder2Sent++
          results.details.push({
            invoiceNumber: invoice.invoice_number,
            email: student.email,
            daysOverdue,
            reminderLevel: 2,
            action: dryRun ? 'WOULD SEND Reminder 2' : 'SENT Reminder 2'
          })
          console.log(`📧 ${dryRun ? '[DRY-RUN]' : ''} Reminder 2 to ${student.email} for invoice ${invoice.invoice_number}`)
        }
        // Reminder 3: 30 days overdue (final notice)
        else if (invoice.reminder_2_sent_at && !invoice.reminder_3_sent_at && daysOverdue >= 30) {
          if (!dryRun && resendApiKey) {
            await sendReminderEmail(
              resendApiKey,
              student.email,
              student.first_name,
              invoice.invoice_number,
              invoice.amount_ttc || invoice.amount_ht,
              invoice.due_date,
              3
            )

            await supabase
              .from('invoices')
              .update({ reminder_3_sent_at: now.toISOString() })
              .eq('id', invoice.id)
          }

          results.reminder3Sent++
          results.details.push({
            invoiceNumber: invoice.invoice_number,
            email: student.email,
            daysOverdue,
            reminderLevel: 3,
            action: dryRun ? 'WOULD SEND Final Notice' : 'SENT Final Notice'
          })
          console.log(`📧 ${dryRun ? '[DRY-RUN]' : ''} Final notice to ${student.email} for invoice ${invoice.invoice_number}`)
        }
        // No action needed yet
        else {
          let reason = 'Not due for reminder yet'
          if (daysOverdue < 7) reason = `Only ${daysOverdue} days overdue (needs 7+)`
          else if (invoice.reminder_3_sent_at) reason = 'All reminders already sent'
          else if (!invoice.reminder_1_sent_at && daysOverdue >= 15) reason = 'Reminder 1 not sent yet'
          else if (!invoice.reminder_2_sent_at && daysOverdue >= 30) reason = 'Reminder 2 not sent yet'
          
          results.details.push({
            invoiceNumber: invoice.invoice_number,
            email: student.email,
            daysOverdue,
            reminderLevel: null,
            action: `SKIPPED - ${reason}`
          })
        }
      } catch (emailError) {
        const errorMsg = `Failed to send reminder for invoice ${invoice.invoice_number}: ${emailError}`
        console.error(`❌ ${errorMsg}`)
        results.errors.push(errorMsg)
      }
    }

    const summary = dryRun
      ? `[DRY-RUN] Would send ${results.reminder1Sent} first, ${results.reminder2Sent} second, ${results.reminder3Sent} final reminders`
      : `Sent ${results.reminder1Sent} first, ${results.reminder2Sent} second, ${results.reminder3Sent} final reminders`

    console.log(`✅ ${summary}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error processing invoice reminders:', error)
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
  invoiceNumber: string,
  amount: number,
  dueDate: string,
  reminderLevel: 1 | 2 | 3
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)

  const formattedDueDate = new Date(dueDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  let subject: string
  let body: string
  
  switch (reminderLevel) {
    case 1:
      subject = `Rappel de paiement - Facture ${invoiceNumber}`
      body = `
        <h2>Bonjour ${firstName},</h2>
        <p>Nous vous informons que la facture <strong>${invoiceNumber}</strong> d'un montant de <strong>${formattedAmount}</strong>, échue le ${formattedDueDate}, n'a pas encore été réglée.</p>
        <p>Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.</p>
        <p>Si le paiement a déjà été effectué, veuillez ne pas tenir compte de ce message.</p>
        <p>Cordialement,<br>L'équipe FLI Formation</p>
      `
      break
    case 2:
      subject = `Second rappel de paiement - Facture ${invoiceNumber}`
      body = `
        <h2>Bonjour ${firstName},</h2>
        <p>Malgré notre précédent rappel, nous constatons que la facture <strong>${invoiceNumber}</strong> d'un montant de <strong>${formattedAmount}</strong>, échue le ${formattedDueDate}, reste impayée.</p>
        <p>Nous vous prions de régulariser cette situation dans les plus brefs délais afin d'éviter toute procédure de recouvrement.</p>
        <p>Si vous rencontrez des difficultés de paiement, n'hésitez pas à nous contacter pour trouver une solution.</p>
        <p>Cordialement,<br>L'équipe FLI Formation</p>
      `
      break
    case 3:
      subject = `URGENT - Mise en demeure - Facture ${invoiceNumber}`
      body = `
        <h2>Bonjour ${firstName},</h2>
        <p><strong>Dernier avis avant procédure de recouvrement</strong></p>
        <p>Malgré nos relances précédentes, la facture <strong>${invoiceNumber}</strong> d'un montant de <strong>${formattedAmount}</strong>, échue le ${formattedDueDate}, demeure impayée.</p>
        <p>Sans règlement de votre part sous 8 jours, nous nous verrons dans l'obligation de transmettre ce dossier à notre service de recouvrement.</p>
        <p>Des frais supplémentaires et des intérêts de retard pourront alors s'appliquer conformément à nos conditions générales.</p>
        <p>Pour toute question ou pour régulariser votre situation, veuillez nous contacter immédiatement.</p>
        <p>Cordialement,<br>L'équipe FLI Formation</p>
      `
      break
  }

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
