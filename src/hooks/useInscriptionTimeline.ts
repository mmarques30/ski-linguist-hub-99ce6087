import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InscriptionTimelineEventType =
  | "created"
  | "email"
  | "payment"
  | "document"
  | "schedule"
  | "status";

export interface InscriptionTimelineEvent {
  id: string;
  type: InscriptionTimelineEventType;
  at: string;
  title: string;
  description?: string;
  status?: string;
}

const EMAIL_LABELS: Record<string, string> = {
  inscription_confirmation: "Confirmation d'inscription",
  inscription_ski_monitor_welcome: "Documents moniteur de ski",
  schedule_validation_reminder: "Rappel validation horaire",
  student_portal_invite: "Invitation espace stagiaire",
};

export function useInscriptionTimeline(inscriptionId?: string) {
  return useQuery({
    queryKey: ["inscription-timeline", inscriptionId],
    queryFn: async (): Promise<InscriptionTimelineEvent[]> => {
      if (!inscriptionId) return [];

      const [inscriptionRes, emailsRes, paymentsRes, documentsRes, auditRes] =
        await Promise.all([
          supabase
            .from("inscriptions")
            .select(
              "created_at, status_changed_at, schedule_approved_at, schedule_status, status"
            )
            .eq("id", inscriptionId)
            .maybeSingle(),
          supabase
            .from("email_log")
            .select("id, template_slug, recipient_email, status, sent_at, error_message")
            .eq("inscription_id", inscriptionId)
            .order("sent_at", { ascending: false }),
          supabase
            .from("payments")
            .select("id, amount, payment_method, payment_type, status, payment_date, created_at")
            .eq("inscription_id", inscriptionId)
            .order("created_at", { ascending: false }),
          supabase
            .from("document_sendings")
            .select("id, document_type, sent_at, sent_to")
            .eq("inscription_id", inscriptionId)
            .order("sent_at", { ascending: false }),
          supabase
            .from("audit_log")
            .select("id, action, created_at, new_values, old_values")
            .eq("table_name", "inscriptions")
            .eq("record_id", inscriptionId)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

      if (inscriptionRes.error) throw inscriptionRes.error;
      if (emailsRes.error) throw emailsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (documentsRes.error) throw documentsRes.error;
      if (auditRes.error) throw auditRes.error;

      const events: InscriptionTimelineEvent[] = [];

      if (inscriptionRes.data?.created_at) {
        events.push({
          id: `created-${inscriptionId}`,
          type: "created",
          at: inscriptionRes.data.created_at,
          title: "Inscription créée",
        });
      }

      for (const email of emailsRes.data || []) {
        events.push({
          id: `email-${email.id}`,
          type: "email",
          at: email.sent_at,
          title: EMAIL_LABELS[email.template_slug] || email.template_slug,
          description: email.recipient_email,
          status: email.status,
        });
      }

      for (const payment of paymentsRes.data || []) {
        events.push({
          id: `payment-${payment.id}`,
          type: "payment",
          at: payment.payment_date || payment.created_at,
          title: `Paiement ${payment.amount} €`,
          description: `${payment.payment_method} · ${payment.payment_type}`,
          status: payment.status,
        });
      }

      for (const doc of documentsRes.data || []) {
        events.push({
          id: `doc-${doc.id}`,
          type: "document",
          at: doc.sent_at,
          title: `Document envoyé — ${doc.document_type}`,
          description: doc.sent_to,
        });
      }

      if (inscriptionRes.data?.schedule_approved_at) {
        const slot = inscriptionRes.data.schedule_status;
        events.push({
          id: `schedule-${inscriptionId}`,
          type: "schedule",
          at: inscriptionRes.data.schedule_approved_at,
          title: "Horaire validé",
          description:
            slot === "matin"
              ? "Groupe du matin"
              : slot === "apres-midi"
                ? "Groupe de l'après-midi"
                : slot || undefined,
        });
      }

      for (const entry of auditRes.data || []) {
        if (entry.action === "UPDATE" && entry.new_values && typeof entry.new_values === "object") {
          const newStatus = (entry.new_values as { status?: string }).status;
          const oldStatus = (entry.old_values as { status?: string } | null)?.status;
          if (newStatus && newStatus !== oldStatus) {
            events.push({
              id: `audit-${entry.id}`,
              type: "status",
              at: entry.created_at,
              title: "Statut modifié",
              description: oldStatus ? `${oldStatus} → ${newStatus}` : newStatus,
            });
          }
        }
      }

      return events.sort(
        (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
      );
    },
    enabled: !!inscriptionId,
  });
}
