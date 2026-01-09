import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, User, Briefcase, BookOpen, Target } from "lucide-react";
import { useState } from "react";
import type { RegistrationData } from "@/pages/register/Index";

interface ConfirmationStepProps {
  data: RegistrationData;
}

const languageLabels: Record<string, string> = {
  english: "Inglês",
  portuguese: "Português",
  russian: "Russo",
  dutch: "Holandês",
};

const modalityLabels: Record<string, string> = {
  in_person: "Presencial",
  online_individual: "Online (Individual)",
  online_group: "Online (Grupo)",
};

const fundingLabels: Record<string, string> = {
  opco: "OPCO / FIFPL",
  company: "Empresa",
  self: "Autofinanciado",
};

const certificationLabels: Record<string, string> = {
  linguaskill: "Linguaskill",
  bright: "Bright Language",
  none: "Sem certificação",
};

export function ConfirmationStep({ data }: ConfirmationStepProps) {
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // Here we would submit to the database
    console.log("Submitting registration:", data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold">Inscrição Concluída</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Obrigado por se inscrever na France Langues International. 
              Você receberá um email de confirmação em breve com mais instruções.
            </p>
            <div className="pt-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                ID da Inscrição: FLI-{Date.now().toString(36).toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirme sua Inscrição</CardTitle>
        <CardDescription>
          Por favor, revise suas informações antes de enviar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            Dados Pessoais
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome</span>
              <span className="font-medium">{data.civility === "madame" ? "Mme" : "M."} {data.firstName} {data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefone</span>
              <span className="font-medium">{data.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Endereço</span>
              <span className="font-medium">{data.address}, {data.postalCode} {data.city}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Professional Profile */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4" />
            Perfil Profissional
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profissão</span>
              <span className="font-medium">
                {data.profession === "ski_instructor" ? "Instrutor de Esqui" : "Outra"}
              </span>
            </div>
            {data.skiSchool && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Escola de Esqui</span>
                <span className="font-medium">{data.skiSchool}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Training Configuration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            Configuração da Formação
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Idioma</span>
              <span className="font-medium">{languageLabels[data.language] || data.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duração</span>
              <span className="font-medium">{data.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modalidade</span>
              <span className="font-medium">{modalityLabels[data.modality] || data.modality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Financiamento</span>
              <span className="font-medium">{fundingLabels[data.fundingType] || data.fundingType}</span>
            </div>
            {data.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Local</span>
                <span className="font-medium">{data.location}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Level and Certification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4" />
            Nível e Certificação
          </div>
          <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nível Atual</span>
              <Badge>{data.currentLevel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Certificação</span>
              <span className="font-medium">{certificationLabels[data.certification] || data.certification}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-3 rounded-lg border p-4">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="terms" className="cursor-pointer">
              Aceito os termos e condições
            </Label>
            <p className="text-sm text-muted-foreground">
              Ao enviar esta inscrição, confirmo que as informações fornecidas são precisas 
              e concordo com os termos e condições de formação da France Langues International.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={!accepted}
        >
          Enviar Inscrição
        </Button>
      </CardContent>
    </Card>
  );
}
