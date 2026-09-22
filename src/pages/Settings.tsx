import { MainLayout } from "@/components/layout/MainLayout";
import { useTabParam } from "@/hooks/useTabParam";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { StripeSettingsCard } from "@/components/settings/StripeSettingsCard";
import { InvoiceSequenceFloorCard } from "@/components/settings/InvoiceSequenceFloorCard";
import { OrganizationIdentityCard } from "@/components/settings/OrganizationIdentityCard";
import { TaughtLanguagesCard } from "@/components/settings/TaughtLanguagesCard";
import { StudentPortalEnabledCard } from "@/components/settings/StudentPortalEnabledCard";
import { SCHEDULE_ASSIGNMENT_DAYS_BEFORE } from "@/lib/placement-test-engine";

/**
 * BL-036 — `/settings` n'écrivait rien : le bouton « Enregistrer les
 * modifications » se limitait à un `console.log` puis annonçait un succès.
 * Chaque carte enregistre désormais sa propre section, et les réglages qui ne
 * sont encore reliés à rien le disent au lieu de simuler une sauvegarde.
 */

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
  const [settingsTab, setSettingsTab] = useTabParam(
    ["general", "notifications", "integrations", "languages"] as const,
  );
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
          <p className="text-muted-foreground">{t(translations.subtitle)}</p>
        </div>

        <Tabs value={settingsTab} onValueChange={setSettingsTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">{t(translations.tabGeneral)}</TabsTrigger>
            <TabsTrigger value="notifications">{t(translations.tabNotifications)}</TabsTrigger>
            <TabsTrigger value="integrations">{t(translations.tabIntegrations)}</TabsTrigger>
            <TabsTrigger value="languages">{t(translations.tabLanguages)}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <OrganizationIdentityCard />
            <StudentPortalEnabledCard />

            <Card>
              <CardHeader>
                <CardTitle>Valeurs par défaut</CardTitle>
                <CardDescription>
                  Règles appliquées aujourd&apos;hui aux sessions et aux inscriptions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid gap-4 md:grid-cols-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">
                      Validation des groupes matin / après-midi
                    </dt>
                    <dd className="font-medium">
                      {SCHEDULE_ASSIGNMENT_DAYS_BEFORE} jours avant le début des cours
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Capacité d&apos;une session</dt>
                    <dd className="font-medium">Saisie session par session</dd>
                  </div>
                </dl>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Ces deux règles sont portées par le code et les sessions
                    elles-mêmes. Elles s&apos;affichent ici pour information : aucun
                    réglage n&apos;est enregistrable pour l&apos;instant.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <InvoiceSequenceFloorCard />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Emails automatiques</CardTitle>
                <CardDescription>
                  Modèles, destinataires et déclencheurs des emails envoyés par
                  l&apos;application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t(translations.paymentIntegration)}</CardTitle>
                <CardDescription>{t(translations.paymentIntegrationDesc)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StripeSettingsCard configureLabel={t(translations.configure)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>Service d&apos;email transactionnel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <span className="font-bold text-primary">R</span>
                    </div>
                    <div>
                      <p className="font-medium">Resend</p>
                      <p className="text-sm text-muted-foreground">
                        Clé <code>RESEND_API_KEY</code> côté fonctions Edge
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link to="/admin/emails">Voir les envois</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="languages" className="space-y-6">
            <TaughtLanguagesCard />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
