import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import fliLogo from "@/assets/fli-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
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
  organization: {
    fr: "Organisation",
    "pt-BR": "Organização",
    en: "Organization",
  },
  organizationDesc: {
    fr: "Détails et identité visuelle de votre organisation",
    "pt-BR": "Detalhes e identidade visual da sua organização",
    en: "Details and visual identity of your organization",
  },
  changeLogo: {
    fr: "Changer le logo",
    "pt-BR": "Alterar logo",
    en: "Change Logo",
  },
  orgName: {
    fr: "Nom de l'organisation",
    "pt-BR": "Nome da organização",
    en: "Organization Name",
  },
  contactEmail: {
    fr: "Email de contact",
    "pt-BR": "E-mail de contato",
    en: "Contact Email",
  },
  phone: {
    fr: "Téléphone",
    "pt-BR": "Telefone",
    en: "Phone",
  },
  website: {
    fr: "Site web",
    "pt-BR": "Website",
    en: "Website",
  },
  defaultSettings: {
    fr: "Paramètres par défaut",
    "pt-BR": "Configurações padrão",
    en: "Default Settings",
  },
  defaultSettingsDesc: {
    fr: "Configurez les valeurs par défaut pour les nouvelles sessions et inscriptions",
    "pt-BR": "Configure os valores padrão para novas sessões e inscrições",
    en: "Configure default values for new sessions and enrollments",
  },
  defaultCapacity: {
    fr: "Capacité par défaut des sessions",
    "pt-BR": "Capacidade padrão das sessões",
    en: "Default Session Capacity",
  },
  enrollmentDeadline: {
    fr: "Délai d'inscription (jours avant)",
    "pt-BR": "Prazo de inscrição (dias antes)",
    en: "Enrollment Deadline (days before)",
  },
  emailNotifications: {
    fr: "Notifications par email",
    "pt-BR": "Notificações por e-mail",
    en: "Email Notifications",
  },
  emailNotificationsDesc: {
    fr: "Configurez l'envoi automatique d'emails",
    "pt-BR": "Configure o envio automático de e-mails",
    en: "Configure automatic email sending",
  },
  newEnrollment: {
    fr: "Nouvelle inscription",
    "pt-BR": "Nova inscrição",
    en: "New Enrollment",
  },
  newEnrollmentDesc: {
    fr: "Envoyer un email de confirmation lors d'une nouvelle inscription",
    "pt-BR": "Enviar e-mail de confirmação para novas inscrições",
    en: "Send confirmation email for new enrollments",
  },
  sessionReminder: {
    fr: "Rappel de session",
    "pt-BR": "Lembrete de sessão",
    en: "Session Reminder",
  },
  sessionReminderDesc: {
    fr: "Envoyer un rappel 24h avant le début de la session",
    "pt-BR": "Enviar lembrete 24h antes do início da sessão",
    en: "Send reminder 24h before session starts",
  },
  deadlineAlert: {
    fr: "Délai d'inscription",
    "pt-BR": "Prazo de inscrição",
    en: "Enrollment Deadline",
  },
  deadlineAlertDesc: {
    fr: "Notifier l'admin lorsque le délai d'inscription approche",
    "pt-BR": "Notificar admin quando o prazo de inscrição se aproximar",
    en: "Notify admin when enrollment deadline approaches",
  },
  testResults: {
    fr: "Résultats de test",
    "pt-BR": "Resultados de testes",
    en: "Test Results",
  },
  testResultsDesc: {
    fr: "Envoyer les résultats du test de niveau aux stagiaires",
    "pt-BR": "Enviar resultados do teste de nível aos estagiários",
    en: "Send placement test results to students",
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
  stripeDesc: {
    fr: "Accepter les paiements par carte bancaire",
    "pt-BR": "Aceitar pagamentos por cartão de crédito",
    en: "Accept credit card payments",
  },
  configure: {
    fr: "Configurer",
    "pt-BR": "Configurar",
    en: "Configure",
  },
  communication: {
    fr: "Communication",
    "pt-BR": "Comunicação",
    en: "Communication",
  },
  communicationDesc: {
    fr: "Configurez les services d'email et SMS",
    "pt-BR": "Configure os serviços de e-mail e SMS",
    en: "Configure email and SMS services",
  },
  resendDesc: {
    fr: "Service d'email transactionnel",
    "pt-BR": "Serviço de e-mail transacional",
    en: "Transactional email service",
  },
  taughtLanguages: {
    fr: "Langues enseignées",
    "pt-BR": "Idiomas ensinados",
    en: "Taught Languages",
  },
  taughtLanguagesDesc: {
    fr: "Configurez les langues disponibles pour l'enseignement",
    "pt-BR": "Configure os idiomas disponíveis para ensino",
    en: "Configure languages available for teaching",
  },
  cancel: {
    fr: "Annuler",
    "pt-BR": "Cancelar",
    en: "Cancel",
  },
  saveChanges: {
    fr: "Enregistrer les modifications",
    "pt-BR": "Salvar alterações",
    en: "Save Changes",
  },
  // Language names
  langEnglish: {
    fr: "Anglais",
    "pt-BR": "Inglês",
    en: "English",
  },
  langPortuguese: {
    fr: "Portugais",
    "pt-BR": "Português",
    en: "Portuguese",
  },
  langRussian: {
    fr: "Russe",
    "pt-BR": "Russo",
    en: "Russian",
  },
  langDutch: {
    fr: "Néerlandais",
    "pt-BR": "Holandês",
    en: "Dutch",
  },
  langSpanish: {
    fr: "Espagnol",
    "pt-BR": "Espanhol",
    en: "Spanish",
  },
  langItalian: {
    fr: "Italien",
    "pt-BR": "Italiano",
    en: "Italian",
  },
  langGerman: {
    fr: "Allemand",
    "pt-BR": "Alemão",
    en: "German",
  },
  langFLE: {
    fr: "Français Langue Étrangère",
    "pt-BR": "Francês Língua Estrangeira",
    en: "French as a Foreign Language",
  },
  langChinese: {
    fr: "Chinois",
    "pt-BR": "Chinês",
    en: "Chinese",
  },
  saveSuccess: {
    fr: "Modifications enregistrées avec succès",
    "pt-BR": "Alterações salvas com sucesso",
    en: "Changes saved successfully",
  },
};

const initialLanguages: Record<string, boolean> = {
  English: true,
  Portuguese: true,
  Russian: true,
  Dutch: true,
  Spanish: false,
  Italian: false,
  German: false,
  FLE: false,
  Chinese: false,
};

export default function Settings() {
  const { t } = useLanguage();
  const [enabledLanguages, setEnabledLanguages] = useState<Record<string, boolean>>(initialLanguages);

  const languageList = [
    { key: "English", label: t(translations.langEnglish) },
    { key: "Portuguese", label: t(translations.langPortuguese) },
    { key: "Russian", label: t(translations.langRussian) },
    { key: "Dutch", label: t(translations.langDutch) },
    { key: "Spanish", label: t(translations.langSpanish) },
    { key: "Italian", label: t(translations.langItalian) },
    { key: "German", label: t(translations.langGerman) },
    { key: "FLE", label: t(translations.langFLE) },
    { key: "Chinese", label: t(translations.langChinese) },
  ];

  const handleLanguageToggle = (key: string, checked: boolean) => {
    setEnabledLanguages((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = () => {
    // TODO: Persist settings to database when ready
    console.log("Saving languages:", enabledLanguages);
    toast.success(t(translations.saveSuccess));
  };
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
            <TabsTrigger value="general">{t(translations.tabGeneral)}</TabsTrigger>
            <TabsTrigger value="notifications">{t(translations.tabNotifications)}</TabsTrigger>
            <TabsTrigger value="integrations">{t(translations.tabIntegrations)}</TabsTrigger>
            <TabsTrigger value="languages">{t(translations.tabLanguages)}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t(translations.organization)}</CardTitle>
                <CardDescription>
                  {t(translations.organizationDesc)}
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
                  {t(translations.defaultSettingsDesc)}
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
                    <Label htmlFor="inscription-deadline">{t(translations.enrollmentDeadline)}</Label>
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
                  {t(translations.emailNotificationsDesc)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t(translations.newEnrollment)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(translations.newEnrollmentDesc)}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t(translations.sessionReminder)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(translations.sessionReminderDesc)}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t(translations.deadlineAlert)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(translations.deadlineAlertDesc)}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t(translations.testResults)}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(translations.testResultsDesc)}
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
                  {t(translations.paymentIntegrationDesc)}
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
                        {t(translations.stripeDesc)}
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
                  {t(translations.communicationDesc)}
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
                        {t(translations.resendDesc)}
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
                  {t(translations.taughtLanguagesDesc)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {languageList.map((lang) => (
                  <div key={lang.key} className="flex items-center justify-between py-2">
                    <span className="font-medium">{lang.label}</span>
                    <Switch 
                      checked={enabledLanguages[lang.key]} 
                      onCheckedChange={(checked) => handleLanguageToggle(lang.key, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEnabledLanguages(initialLanguages)}>
            {t(translations.cancel)}
          </Button>
          <Button onClick={handleSave}>{t(translations.saveChanges)}</Button>
        </div>
      </div>
    </MainLayout>
  );
}
