import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  Info,
  Languages,
  Mail,
  Send,
  SettingsIcon,
  SlidersHorizontal,
  Plug,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { StripeSettingsCard } from "@/components/settings/StripeSettingsCard";
import { InvoiceSequenceFloorCard } from "@/components/settings/InvoiceSequenceFloorCard";
import { OrganizationIdentityCard } from "@/components/settings/OrganizationIdentityCard";
import { TaughtLanguagesCard } from "@/components/settings/TaughtLanguagesCard";
import { StudentPortalEnabledCard } from "@/components/settings/StudentPortalEnabledCard";
import { SCHEDULE_ASSIGNMENT_DAYS_BEFORE } from "@/lib/placement-test-engine";
import {
  DefinitionList,
  PageHeader,
  PageShell,
  SectionHeading,
  SegmentedControl,
  SurfaceCard,
} from "@/components/ui-kit";

/**
 * BL-036 — `/settings` n'écrivait rien : le bouton « Enregistrer les
 * modifications » se limitait à un `console.log` puis annonçait un succès.
 * Chaque carte enregistre désormais sa propre section, et les réglages qui ne
 * sont encore reliés à rien le disent au lieu de simuler une sauvegarde.
 */

type SettingsTab = "general" | "notifications" | "integrations" | "languages";

const translations = {
  title: {
    fr: "Paramètres",
    "pt-BR": "Configurações",
    en: "Settings",
  },
  subtitle: {
    fr: "Gérez vos préférences et la configuration de l'application",
    "pt-BR": "Gerencie suas preferências e a configuração do aplicativo",
    en: "Manage your preferences and application settings",
  },
  tabGeneral: {
    fr: "Général",
    "pt-BR": "Geral",
    en: "General",
  },
  tabNotifications: {
    fr: "Notifications",
    "pt-BR": "Notificações",
    en: "Notifications",
  },
  tabIntegrations: {
    fr: "Intégrations",
    "pt-BR": "Integrações",
    en: "Integrations",
  },
  tabLanguages: {
    fr: "Langues",
    "pt-BR": "Idiomas",
    en: "Languages",
  },
  paymentIntegration: {
    fr: "Intégration de paiement",
    "pt-BR": "Integração de pagamento",
    en: "Payment Integration",
  },
  paymentIntegrationDesc: {
    fr: "Configurez Stripe pour les paiements en ligne",
    "pt-BR": "Configure o Stripe para pagamentos online",
    en: "Configure Stripe for online payments",
  },
  configure: {
    fr: "Configurer",
    "pt-BR": "Configurar",
    en: "Configure",
  },
};

export default function Settings() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<SettingsTab>("general");

  return (
    <MainLayout>
      <PageShell>
        <PageHeader
          title={t(translations.title)}
          description={t(translations.subtitle)}
          icon={SettingsIcon}
          tone="navy"
          tabs={
            <SegmentedControl<SettingsTab>
              value={tab}
              onChange={setTab}
              ariaLabel={t(translations.title)}
              options={[
                { value: "general", label: t(translations.tabGeneral), icon: SlidersHorizontal },
                { value: "notifications", label: t(translations.tabNotifications), icon: Bell },
                { value: "integrations", label: t(translations.tabIntegrations), icon: Plug },
                { value: "languages", label: t(translations.tabLanguages), icon: Languages },
              ]}
            />
          }
        />

        {tab === "general" && (
          <div className="space-y-4 lg:space-y-5">
            <OrganizationIdentityCard />
            <StudentPortalEnabledCard />

            <SurfaceCard
              title="Valeurs par défaut"
              icon={SlidersHorizontal}
              description="Règles appliquées aujourd'hui aux sessions et aux inscriptions."
            >
              <div className="space-y-4">
                <DefinitionList
                  items={[
                    {
                      label: "Validation des groupes matin / après-midi",
                      value: `${SCHEDULE_ASSIGNMENT_DAYS_BEFORE} jours avant le début des cours`,
                    },
                    {
                      label: "Capacité d'une session",
                      value: "Saisie session par session",
                    },
                  ]}
                  columns={2}
                />
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Ces deux règles sont portées par le code et les sessions
                    elles-mêmes. Elles s&apos;affichent ici pour information : aucun
                    réglage n&apos;est enregistrable pour l&apos;instant.
                  </AlertDescription>
                </Alert>
              </div>
            </SurfaceCard>

            <InvoiceSequenceFloorCard />
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-4 lg:space-y-5">
            <SurfaceCard
              title="Emails automatiques"
              icon={Mail}
              description="Modèles, destinataires et déclencheurs des emails envoyés par l'application."
            >
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Les emails sont pilotés par les modèles et leur état actif dans{" "}
                    <strong>Emails</strong>. Cet écran n&apos;a plus
                    d&apos;interrupteurs : ils n&apos;étaient reliés à rien et
                    laissaient croire qu&apos;un envoi pouvait être coupé ici.
                  </AlertDescription>
                </Alert>
                <Button asChild variant="outline">
                  <Link to="/admin/emails">Ouvrir la gestion des emails</Link>
                </Button>
              </div>
            </SurfaceCard>
          </div>
        )}

        {tab === "integrations" && (
          <div className="space-y-4 lg:space-y-5">
            <SectionHeading
              title={t(translations.paymentIntegration)}
              description={t(translations.paymentIntegrationDesc)}
            />
            <StripeSettingsCard configureLabel={t(translations.configure)} />

            <SurfaceCard
              title="Communication"
              icon={Send}
              description="Service d'email transactionnel."
            >
              <div className="flex flex-col gap-3 rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-sunken))] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="fli-icon-chip h-10 w-10 shrink-0 bg-[hsl(var(--tint-neutral-bg))] font-bold text-primary">
                    R
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">Resend</p>
                    <p className="text-sm text-muted-foreground">
                      Clé <code>RESEND_API_KEY</code> côté fonctions Edge
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="shrink-0">
                  <Link to="/admin/emails">Voir les envois</Link>
                </Button>
              </div>
            </SurfaceCard>
          </div>
        )}

        {tab === "languages" && (
          <div className="space-y-4 lg:space-y-5">
            <TaughtLanguagesCard />
          </div>
        )}
      </PageShell>
    </MainLayout>
  );
}
