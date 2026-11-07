import { Link } from "react-router";
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  ClipboardPen,
  FileText,
  LayoutDashboard,
  Mail,
  Phone,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { FormateurPageShell } from "@/components/layout/FormateurPageShell";
import { useFormateurView } from "@/contexts/FormateurViewContext";
import {
  FORMATEUR_ONBOARDING_APP_LINKS,
  FORMATEUR_ONBOARDING_INTRO,
  FORMATEUR_ONBOARDING_SECTIONS,
  FORMATEUR_ONBOARDING_TITLE,
} from "@/lib/formateur-onboarding";
import {
  PageHeader,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

const APP_LINK_ICONS = {
  "tableau-de-bord": LayoutDashboard,
  planning: Calendar,
  stagiaires: Users,
  bilans: ClipboardList,
  presences: ClipboardPen,
  evaluations: ClipboardCheck,
  documents: FileText,
  paiements: Wallet,
  profil: User,
} as const;

export default function FormateurOnboarding() {
  const { basePath } = useFormateurView();

  const quiEstFli = FORMATEUR_ONBOARDING_SECTIONS.find((s) => s.id === "qui-est-fli");
  const fonctionnement = FORMATEUR_ONBOARDING_SECTIONS.find(
    (s) => s.id === "fonctionnement"
  );
  const cours = FORMATEUR_ONBOARDING_SECTIONS.find((s) => s.id === "cours");
  const appli = FORMATEUR_ONBOARDING_SECTIONS.find((s) => s.id === "appli");
  const contact = FORMATEUR_ONBOARDING_SECTIONS.find((s) => s.id === "contact");

  return (
    <FormateurPageShell>
      <PageShell>
        <PageHeader
          title={FORMATEUR_ONBOARDING_TITLE}
          description={FORMATEUR_ONBOARDING_INTRO}
          icon={BookOpen}
          tone="gold"
          actions={
            <Button asChild>
              <Link to={`${basePath}/tableau-de-bord`}>Aller au tableau de bord</Link>
            </Button>
          }
        />

        {quiEstFli ? (
          <SurfaceCard title={quiEstFli.title} icon={BookOpen}>
            <div className="space-y-3 text-sm text-muted-foreground">
              {quiEstFli.paragraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {quiEstFli.bullets ? (
                <ul className="list-disc space-y-1.5 pl-5 text-foreground">
                  {quiEstFli.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </SurfaceCard>
        ) : null}

        {fonctionnement ? (
          <SurfaceCard title={fonctionnement.title} icon={ClipboardCheck}>
            <div className="space-y-3 text-sm">
              {fonctionnement.lead ? (
                <p className="text-muted-foreground">{fonctionnement.lead}</p>
              ) : null}
              {fonctionnement.bullets ? (
                <ol className="list-decimal space-y-2 pl-5">
                  {fonctionnement.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          </SurfaceCard>
        ) : null}

        {cours ? (
          <SurfaceCard title={cours.title} icon={Calendar}>
            <div className="space-y-3 text-sm">
              {cours.lead ? <p className="text-muted-foreground">{cours.lead}</p> : null}
              {cours.bullets ? (
                <ul className="list-disc space-y-2 pl-5">
                  {cours.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </SurfaceCard>
        ) : null}

        {appli ? (
          <div className="space-y-3">
            <SectionHeading title={appli.title} description={appli.lead} />
            {appli.paragraphs?.map((p) => (
              <p key={p} className="text-sm text-muted-foreground">
                {p}
              </p>
            ))}
            <ul className="grid gap-3 sm:grid-cols-2">
              {FORMATEUR_ONBOARDING_APP_LINKS.map((item) => {
                const Icon = APP_LINK_ICONS[item.page];
                return (
                  <li key={item.page}>
                    <SurfaceCard>
                      <Link
                        to={`${basePath}/${item.page}`}
                        className="flex gap-3 text-left transition-colors hover:text-primary"
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 space-y-1">
                          <span className="block text-sm font-medium text-foreground">
                            {item.label}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </SurfaceCard>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {contact ? (
          <SurfaceCard title={contact.title} icon={Mail}>
            <div className="space-y-3 text-sm text-muted-foreground">
              {contact.paragraphs?.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <div className="flex flex-wrap gap-3 pt-1">
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:info@fli.fr">
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                    info@fli.fr
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="tel:+33479282109">
                    <Phone className="mr-1.5 h-3.5 w-3.5" />
                    04 79 28 21 09
                  </a>
                </Button>
              </div>
            </div>
          </SurfaceCard>
        ) : null}
      </PageShell>
    </FormateurPageShell>
  );
}
