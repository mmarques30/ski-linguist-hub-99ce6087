import { Link } from "react-router";
import { Info, Shield } from "lucide-react";
import fliLogo from "@/assets/fli-logo.png";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SurfaceCard } from "@/components/ui-kit";
import { ManageCookiesButton } from "@/components/legal/CookieConsentBanner";
import {
  POLITIQUE_CONFIDENTIALITE_INTRO,
  POLITIQUE_CONFIDENTIALITE_SECTIONS,
  POLITIQUE_CONFIDENTIALITE_TITLE,
  POLITIQUE_CONFIDENTIALITE_UPDATED_AT,
} from "@/lib/politique-confidentialite-content";

function formatDateFr(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PolitiqueConfidentialite() {
  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--surface-page))]">
      <header className="border-b border-border bg-[hsl(var(--surface-raised))]">
        <div className="container mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" aria-label="Retour à l'accueil FLI">
            <img src={fliLogo} alt="FLI" className="h-10 w-auto sm:h-12" />
          </Link>
          <p className="text-sm text-muted-foreground">
            Mise à jour du {formatDateFr(POLITIQUE_CONFIDENTIALITE_UPDATED_AT)}
          </p>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-6 sm:py-8">
        <div className="mx-auto max-w-3xl animate-fade-up space-y-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-balance sm:text-2xl">
              {POLITIQUE_CONFIDENTIALITE_TITLE}
            </h1>
            <p className="text-sm text-muted-foreground">France Langues International</p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{POLITIQUE_CONFIDENTIALITE_INTRO}</AlertDescription>
          </Alert>

          <SurfaceCard title="Vos préférences cookies" icon={Shield}>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Les cookies analytiques (Google Analytics) ne sont déposés qu'avec votre
              consentement. Vous pouvez changer d'avis à tout moment.
            </p>
            <ManageCookiesButton className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline" />
          </SurfaceCard>

          {POLITIQUE_CONFIDENTIALITE_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <SurfaceCard>
                <h2 className="text-base font-semibold leading-snug text-balance text-foreground">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </SurfaceCard>
            </section>
          ))}
        </div>
      </main>

      <footer className="border-t border-border bg-[hsl(var(--surface-raised))]">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-4 px-4 py-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Accueil
          </Link>
          <Link to="/conditions-generales" className="hover:text-foreground">
            Conditions générales
          </Link>
          <span>France Langues International — info@fli.fr</span>
        </div>
      </footer>
    </div>
  );
}
