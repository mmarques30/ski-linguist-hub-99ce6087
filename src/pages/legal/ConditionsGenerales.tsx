import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Building2, ScrollText } from "lucide-react";
import fliLogo from "@/assets/fli-logo.png";
import { SurfaceCard } from "@/components/ui-kit";
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
    <div className="flex min-h-screen flex-col bg-[hsl(var(--surface-page))]">
      <header className="border-b border-border bg-[hsl(var(--surface-raised))]">
        <div className="container mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <img src={fliLogo} alt="FLI" className="h-10 w-auto sm:h-12" />
          <p className="text-sm text-muted-foreground">
            Mise à jour du {formatDateFr(CONDITIONS_GENERALES_UPDATED_AT)}
          </p>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl animate-fade-up space-y-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {CONDITIONS_GENERALES_TITLE}
            </h1>
            {identity?.legal_name && (
              <p className="text-sm text-muted-foreground">{identity.legal_name}</p>
            )}
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{CONDITIONS_GENERALES_PROVENANCE}</AlertDescription>
          </Alert>

          {identity?.legal_name && (
            <SurfaceCard title="Organisme de formation" icon={Building2}>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{identity.legal_name}</p>
                {identity.representative && <p>Représenté par {identity.representative}</p>}
                {adresse && <p>{adresse}</p>}
                {identity.phone && <p>Téléphone : {identity.phone}</p>}
                {identity.email && <p className="break-all">Email : {identity.email}</p>}
                {identity.website && <p className="break-all">{identity.website}</p>}
                {mentions.map((mention) => (
                  <p key={mention} className="text-muted-foreground">
                    {mention}
                  </p>
                ))}
              </div>
            </SurfaceCard>
          )}

          {CONDITIONS_GENERALES_SECTIONS.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <SurfaceCard>
                {/* Le titre est rendu dans le corps : un intitulé d'article est
                    long et doit passer à la ligne plutôt qu'être tronqué. */}
                <h2 className="text-base font-semibold leading-snug text-balance text-foreground">
                  Article {index + 1} — {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </SurfaceCard>
            </section>
          ))}

          <SurfaceCard title="Règlement intérieur" icon={ScrollText}>
            <p className="text-sm leading-relaxed">{REGLEMENT_INTERIEUR_ON_REQUEST}</p>
          </SurfaceCard>
        </div>
      </main>

      <footer className="border-t border-border bg-[hsl(var(--surface-raised))]">
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
