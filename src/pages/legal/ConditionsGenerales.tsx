import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import fliLogo from "@/assets/fli-logo.png";
import { useOrganizationIdentity } from "@/hooks/useOrganizationIdentity";
import {
  formatOrganizationAddress,
  organizationLegalMentions,
} from "@/lib/organization-identity";
import {
  CONDITIONS_GENERALES_PROVENANCE,
  CONDITIONS_GENERALES_SECTIONS,
  CONDITIONS_GENERALES_TITLE,
  CONDITIONS_GENERALES_UPDATED_AT,
  REGLEMENT_INTERIEUR_ON_REQUEST,
} from "@/lib/conditions-generales-content";

function formatDateFr(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * BL-023 — page publique des conditions générales de formation, ouverte dans un
 * nouvel onglet depuis l'étape 7 de `/register`. Accessible sans être connecté :
 * un stagiaire doit pouvoir lire ce qu'il accepte.
 */
export default function ConditionsGenerales() {
  const { data: identity } = useOrganizationIdentity();
  const mentions = identity ? organizationLegalMentions(identity) : [];
  const adresse = identity ? formatOrganizationAddress(identity) : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img src={fliLogo} alt="FLI" className="h-12 w-auto" />
          <p className="text-sm text-muted-foreground">
            Mise à jour du {formatDateFr(CONDITIONS_GENERALES_UPDATED_AT)}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{CONDITIONS_GENERALES_TITLE}</h1>
            {identity?.legal_name && (
              <p className="text-muted-foreground">{identity.legal_name}</p>
            )}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{CONDITIONS_GENERALES_PROVENANCE}</AlertDescription>
          </Alert>

          {identity?.legal_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Organisme de formation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{identity.legal_name}</p>
                {identity.representative && (
                  <p>Représenté par {identity.representative}</p>
                )}
                {adresse && <p>{adresse}</p>}
                {identity.phone && <p>Téléphone : {identity.phone}</p>}
                {identity.email && <p>Email : {identity.email}</p>}
                {identity.website && <p>{identity.website}</p>}
                {mentions.map((mention) => (
                  <p key={mention} className="text-muted-foreground">
                    {mention}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {CONDITIONS_GENERALES_SECTIONS.map((section, index) => (
            <Card key={section.id} id={section.id}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Article {index + 1} — {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Règlement intérieur</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              {REGLEMENT_INTERIEUR_ON_REQUEST}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            {identity?.legal_name || "France Langues International"}
            {identity?.email ? ` — ${identity.email}` : ""}
          </p>
        </div>
      </footer>
    </div>
  );
}
