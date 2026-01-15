import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import fliLogo from "@/assets/fli-logo.png";
import { useLanguage, Translations } from "@/contexts/LanguageContext";

const translations = {
  title: {
    fr: "Paramètres",
    "pt-BR": "Configurações",
    en: "Settings",
  } as Translations,
  subtitle: {
    fr: "Gérez vos préférences et la configuration de l'application",
    "pt-BR": "Gerencie suas preferências e configuração do aplicativo",
    en: "Manage your preferences and application settings",
  } as Translations,
  general: {
    fr: "Général",
    "pt-BR": "Geral",
    en: "General",
  } as Translations,
  notifications: {
    fr: "Notifications",
    "pt-BR": "Notificações",
    en: "Notifications",
  } as Translations,
  integrations: {
    fr: "Intégrations",
    "pt-BR": "Integrações",
    en: "Integrations",
  } as Translations,
  languages: {
    fr: "Langues",
    "pt-BR": "Idiomas",
    en: "Languages",
  } as Translations,
  organization: {
    fr: "Organisation",
    "pt-BR": "Organização",
    en: "Organization",
  } as Translations,
  organizationDescription: {
    fr: "Détails et identité visuelle de votre organisation",
    "pt-BR": "Detalhes e identidade visual da sua organização",
    en: "Details and visual identity of your organization",
  } as Translations,
  changeLogo: {
    fr: "Changer le logo",
    "pt-BR": "Alterar logo",
    en: "Change logo",
  } as Translations,
  orgName: {
    fr: "Nom de l'organisation",
    "pt-BR": "Nome da organização",
    en: "Organization name",
  } as Translations,
  contactEmail: {
    fr: "Email de contact",
    "pt-BR": "Email de contato",
    en: "Contact email",
  } as Translations,
  phone: {
    fr: "Téléphone",
    "pt-BR": "Telefone",
    en: "Phone",
  } as Translations,
  website: {
    fr: "Site web",
    "pt-BR": "Site web",
    en: "Website",
  } as Translations,
  defaultSettings: {
    fr: "Paramètres par défaut",
    "pt-BR": "Configurações padrão",
    en: "Default settings",
  } as Translations,
  defaultSettingsDescription: {
    fr: "Configurez les valeurs par défaut pour les nouvelles sessions et inscriptions",
    "pt-BR": "Configure os valores padrão para novas sessões e inscrições",
    en: "Configure default values for new sessions and registrations",
  } as Translations,
  defaultCapacity: {
    fr: "Capacité par défaut des sessions",
    "pt-BR": "Capacidade padrão das sessões",
    en: "Default session capacity",
  } as Translations,
  inscriptionDeadline: {
    fr: "Délai d'inscription (jours avant)",
    "pt-BR": "Prazo de inscrição (dias antes)",
    en: "Registration deadline (days before)",
  } as Translations,
  emailNotifications: {
    fr: "Notifications par email",
    "pt-BR": "Notificações por email",
    en: "Email notifications",
  } as Translations,
  emailNotificationsDescription: {
    fr: "Configurez l'envoi automatique d'emails",
    "pt-BR": "Configure o envio automático de emails",
    en: "Configure automatic email sending",
  } as Translations,
  newRegistration: {
    fr: "Nouvelle inscription",
    "pt-BR": "Nova inscrição",
    en: "New registration",
  } as Translations,
  newRegistrationDescription: {
    fr: "Envoyer un email de confirmation lors d'une nouvelle inscription",
    "pt-BR": "Enviar email de confirmação quando houver uma nova inscrição",
    en: "Send confirmation email when there's a new registration",
  } as Translations,
  sessionReminder: {
    fr: "Rappel de session",
    "pt-BR": "Lembrete de sessão",
    en: "Session reminder",
  } as Translations,
  sessionReminderDescription: {
    fr: "Envoyer un rappel 24h avant le début de la session",
    "pt-BR": "Enviar lembrete 24h antes do início da sessão",
    en: "Send reminder 24h before session starts",
  } as Translations,
  registrationDeadline: {
    fr: "Délai d'inscription",
    "pt-BR": "Prazo de inscrição",
    en: "Registration deadline",
  } as Translations,
  registrationDeadlineDescription: {
    fr: "Notifier l'admin lorsque le délai d'inscription approche",
    "pt-BR": "Notificar o admin quando o prazo de inscrição estiver próximo",
    en: "Notify admin when registration deadline approaches",
  } as Translations,
  testResults: {
    fr: "Résultats de test",
    "pt-BR": "Resultados do teste",
    en: "Test results",
  } as Translations,
  testResultsDescription: {
    fr: "Envoyer les résultats du test de niveau aux stagiaires",
    "pt-BR": "Enviar os resultados do teste de nível para os estagiários",
    en: "Send level test results to students",
  } as Translations,
  paymentIntegration: {
    fr: "Intégration de paiement",
    "pt-BR": "Integração de pagamento",
    en: "Payment integration",
  } as Translations,
  paymentDescription: {
    fr: "Configurez Stripe pour les paiements en ligne",
    "pt-BR": "Configure Stripe para pagamentos online",
    en: "Configure Stripe for online payments",
  } as Translations,
  acceptCardPayments: {
    fr: "Accepter les paiements par carte bancaire",
    "pt-BR": "Aceitar pagamentos com cartão de crédito",
    en: "Accept card payments",
  } as Translations,
  configure: {
    fr: "Configurer",
    "pt-BR": "Configurar",
    en: "Configure",
  } as Translations,
  communication: {
    fr: "Communication",
    "pt-BR": "Comunicação",
    en: "Communication",
  } as Translations,
  communicationDescription: {
    fr: "Configurez les services d'email et SMS",
    "pt-BR": "Configure os serviços de email e SMS",
    en: "Configure email and SMS services",
  } as Translations,
  transactionalEmail: {
    fr: "Service d'email transactionnel",
    "pt-BR": "Serviço de email transacional",
    en: "Transactional email service",
  } as Translations,
  taughtLanguages: {
    fr: "Langues enseignées",
    "pt-BR": "Idiomas ensinados",
    en: "Taught languages",
  } as Translations,
  taughtLanguagesDescription: {
    fr: "Configurez les langues disponibles pour l'enseignement",
    "pt-BR": "Configure os idiomas disponíveis para ensino",
    en: "Configure available languages for teaching",
  } as Translations,
  cancel: {
    fr: "Annuler",
    "pt-BR": "Cancelar",
    en: "Cancel",
  } as Translations,
  saveChanges: {
    fr: "Enregistrer les modifications",
    "pt-BR": "Salvar alterações",
    en: "Save changes",
  } as Translations,
  english: {
    fr: "Anglais",
    "pt-BR": "Inglês",
    en: "English",
  } as Translations,
  portuguese: {
    fr: "Portugais",
    "pt-BR": "Português",
    en: "Portuguese",
  } as Translations,
  russian: {
    fr: "Russe",
    "pt-BR": "Russo",
    en: "Russian",
  } as Translations,
  dutch: {
    fr: "Néerlandais",
    "pt-BR": "Holandês",
    en: "Dutch",
  } as Translations,
  spanish: {
    fr: "Espagnol",
    "pt-BR": "Espanhol",
    en: "Spanish",
  } as Translations,
  italian: {
    fr: "Italien",
    "pt-BR": "Italiano",
    en: "Italian",
  } as Translations,
  german: {
    fr: "Allemand",
    "pt-BR": "Alemão",
    en: "German",
  } as Translations,
  japanese: {
    fr: "Japonais",
    "pt-BR": "Japonês",
    en: "Japanese",
  } as Translations,
  chinese: {
    fr: "Chinois",
    "pt-BR": "Chinês",
    en: "Chinese",
  } as Translations,
};

const languageKeys = [
  "english",
  "portuguese",
  "russian",
  "dutch",
  "spanish",
  "italian",
  "german",
  "japanese",
  "chinese",
] as const;

const activeLanguages = ["english", "portuguese", "russian", "dutch"];

export default function Settings() {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{t(translations.title)}</h1>
          <p className="text-muted-foreground">
            {t(translations.subtitle)}
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">{t(translations.general)}</TabsTrigger>
            <TabsTrigger value="notifications">{t(translations.notifications)}</TabsTrigger>
            <TabsTrigger value="integrations">{t(translations.integrations)}</TabsTrigger>
            <TabsTrigger value="languages">{t(translations.languages)}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t(translations.organization)}</CardTitle>
                <CardDescription>
                  {t(translations.organizationDescription)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <img
                    src={fliLogo}
                    alt="FLI Logo"
                    className="h-16 w-auto"
                  />
                  <Button variant="outline">{t(translations.changeLogo)}</Button>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">{t(translations.orgName)}</Label>
                    <Input
                      id="org-name"
                      defaultValue="France Langues International"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-email">{t(translations.contactEmail)}</Label>
                    <Input
                      id="org-email"
                      type="email"
                      defaultValue="contact@fli-langues.fr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-phone">{t(translations.phone)}</Label>
                    <Input
                      id="org-phone"
                      defaultValue="+33 4 79 00 00 00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-website">{t(translations.website)}</Label>
                    <Input
                      id="org-website"
                      defaultValue="https://fli-langues.fr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Default Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t(translations.defaultSettings)}</CardTitle>
                <CardDescription>
                  {t(translations.defaultSettingsDescription)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default-capacity">{t(translations.defaultCapacity)}</Label>
                    <Input
                      id="default-capacity"
                      type="number"
                      defaultValue="12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inscription-deadline">{t(translations.inscriptionDeadline)}</Label>
                    <Input
                      id="inscription-deadline"
                      type="number"
                      defaultValue="10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t(translations.emailNotifications)}</CardTitle>
                <CardDescription>
                  {t(translations.emailNotificationsDescription)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t(translations.newRegistration)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(translations.newRegistrationDescription)}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t(translations.sessionReminder)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(translations.sessionReminderDescription)}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t(translations.registrationDeadline)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(translations.registrationDeadlineDescription)}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t(translations.testResults)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(translations.testResultsDescription)}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t(translations.paymentIntegration)}</CardTitle>
                <CardDescription>
                  {t(translations.paymentDescription)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <span className="font-bold text-primary">S</span>
                    </div>
                    <div>
                      <p className="font-medium">Stripe</p>
                      <p className="text-sm text-muted-foreground">
                        {t(translations.acceptCardPayments)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">{t(translations.configure)}</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t(translations.communication)}</CardTitle>
                <CardDescription>
                  {t(translations.communicationDescription)}
                </CardDescription>
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
                        {t(translations.transactionalEmail)}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">{t(translations.configure)}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="languages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t(translations.taughtLanguages)}</CardTitle>
                <CardDescription>
                  {t(translations.taughtLanguagesDescription)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {languageKeys.map((key) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="font-medium">{t(translations[key])}</span>
                    <Switch defaultChecked={activeLanguages.includes(key)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button variant="outline">{t(translations.cancel)}</Button>
          <Button>{t(translations.saveChanges)}</Button>
        </div>
      </div>
    </MainLayout>
  );
}
