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
  English: "Inglês",
  Portuguese: "Português",
  Russian: "Russo",
  Dutch: "Holandês",
  Spanish: "Espanhol",
  Italian: "Italiano",
  German: "Alemão",
  Japanese: "Japonês",
  Chinese: "Chinês",
};

export default function Settings() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações do aplicativo
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="integrations">Integrações</TabsTrigger>
            <TabsTrigger value="languages">Idiomas</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle>Organização</CardTitle>
                <CardDescription>
                  Detalhes e identidade visual da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <img
                    src={fliLogo}
                    alt="FLI Logo"
                    className="h-16 w-auto"
                  />
                  <Button variant="outline">Alterar Logo</Button>
                </div>
                <Separator />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nome da Organização</Label>
                    <Input
                      id="org-name"
                      defaultValue="France Langues International"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-email">Email de Contato</Label>
                    <Input
                      id="org-email"
                      type="email"
                      defaultValue="contact@fli-langues.fr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-phone">Telefone</Label>
                    <Input
                      id="org-phone"
                      defaultValue="+33 4 79 00 00 00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-website">Site</Label>
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
                <CardTitle>Configurações Padrão</CardTitle>
                <CardDescription>
                  Configure valores padrão para novas turmas e inscrições
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="default-capacity">Capacidade Padrão de Turma</Label>
                    <Input
                      id="default-capacity"
                      type="number"
                      defaultValue="12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inscription-deadline">Prazo de Inscrição (dias antes)</Label>
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
                <CardTitle>Notificações por Email</CardTitle>
                <CardDescription>
                  Configure quando enviar emails automatizados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Nova Inscrição</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar email de confirmação quando uma nova inscrição for recebida
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Lembrete de Aula</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembrete 24h antes do início da aula
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Prazo de Inscrição</p>
                    <p className="text-sm text-muted-foreground">
                      Notificar admin quando o prazo de inscrição se aproximar
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Resultados de Teste</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar resultados do teste de nível para alunos
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
                <CardTitle>Integração de Pagamento</CardTitle>
                <CardDescription>
                  Configure Stripe para pagamentos online
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
                        Aceitar pagamentos com cartão de crédito
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comunicação</CardTitle>
                <CardDescription>
                  Configure serviços de email e SMS
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
                        Serviço de email transacional
                      </p>
                    </div>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="languages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Idiomas de Ensino</CardTitle>
                <CardDescription>
                  Configure os idiomas disponíveis para instrução
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
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar Alterações</Button>
        </div>
      </div>
    </MainLayout>
  );
}
