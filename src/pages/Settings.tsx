import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import fliLogo from "@/assets/fli-logo.png";

const languageLabels: Record<string, string> = {
  English: "Anglais",
  Portuguese: "Portugais",
  Russian: "Russe",
  Dutch: "Néerlandais",
  Spanish: "Espagnol",
  Italian: "Italien",
  German: "Allemand",
  Japanese: "Japonais",
  Chinese: "Chinois",
};

export default function Settings() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">
            Gérez vos préférences et la configuration de l'application
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Intégrations</TabsTrigger>
            <TabsTrigger value="languages">Langues</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle>Organisation</CardTitle>
                <CardDescription>
                  Détails et identité visuelle de votre organisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <img
                    src={fliLogo}
                    alt="FLI Logo"
                    className="h-16 w-auto"
                  />
                  <Button variant="outline">Changer le logo</Button>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nom de l'organisation</Label>
                    <Input
                      id="org-name"
                      defaultValue="France Langues International"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-email">Email de contact</Label>
                    <Input
                      id="org-email"
                      type="email"
                      defaultValue="contact@fli-langues.fr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-phone">Téléphone</Label>
                    <Input
                      id="org-phone"
                      defaultValue="+33 4 79 00 00 00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-website">Site web</Label>
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
                <CardTitle>Paramètres par défaut</CardTitle>
                <CardDescription>
                  Configurez les valeurs par défaut pour les nouvelles sessions et inscriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default-capacity">Capacité par défaut des sessions</Label>
                    <Input
                      id="default-capacity"
                      type="number"
                      defaultValue="12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inscription-deadline">Délai d'inscription (jours avant)</Label>
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
                <CardTitle>Notifications par email</CardTitle>
                <CardDescription>
                  Configurez l'envoi automatique d'emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nouvelle inscription</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyer un email de confirmation lors d'une nouvelle inscription
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappel de session</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyer un rappel 24h avant le début de la session
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Délai d'inscription</p>
                    <p className="text-sm text-muted-foreground">
                      Notifier l'admin lorsque le délai d'inscription approche
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Résultats de test</p>
                    <p className="text-sm text-muted-foreground">
                      Envoyer les résultats du test de niveau aux stagiaires
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
                <CardTitle>Intégration de paiement</CardTitle>
                <CardDescription>
                  Configurez Stripe pour les paiements en ligne
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
                        Accepter les paiements par carte bancaire
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configurer</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication</CardTitle>
                <CardDescription>
                  Configurez les services d'email et SMS
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
                        Service d'email transactionnel
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configurer</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="languages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Langues enseignées</CardTitle>
                <CardDescription>
                  Configurez les langues disponibles pour l'enseignement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(languageLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="font-medium">{label}</span>
                    <Switch defaultChecked={["English", "Portuguese", "Russian", "Dutch"].includes(key)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Annuler</Button>
          <Button>Enregistrer les modifications</Button>
        </div>
      </div>
    </MainLayout>
  );
}
