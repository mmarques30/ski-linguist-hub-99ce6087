import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Award,
  CalendarDays,
  ChartLine,
  GraduationCap,
  Laptop,
  Mail,
  MapPin,
  Menu,
  Phone,
  Play,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactDialog } from "@/components/landing/ContactDialog";
import type { ContactDialogIntent } from "@/lib/landing-contact";
import {
  RECOMMENDED,
  YOUTUBE_TITLE,
  YOUTUBE_VIDEO_ID,
} from "@/components/landing/landing-assets";
import qualiopiCertification from "@/assets/qualiopi-certification.png";
import { useRegistrationOfferings } from "@/hooks/useRegistrationOfferings";
import {
  isOpenOffering,
  sortOfferingsByDateThenLocation,
  type RegistrationOffering,
} from "@/lib/registration-offerings";

const NAV = [
  { label: "Notre méthode", href: "#metodo" },
  { label: "Formations", href: "#formacoes" },
  { label: "Nos stages", href: "#stages" },
  { label: "FAQ", href: "#faq" },
] as const;

const INDICATORS = [
  { value: "87 %", label: "stagiaires satisfait·es ou très satisfait·es" },
  { value: "0,6 %", label: "taux d'abandon" },
  { value: "4,72 / 5", label: "qualité d'animation" },
  { value: "+ de 40 ans", label: "FLI" },
] as const;

const BADGES = ["Groupes de 8 personnes", "Financement FIFPL", "Certifié Qualiopi"] as const;

const METHOD_STEPS = [
  "Test de niveau à l'inscription",
  "Objectifs définis avec le groupe",
  "Formation adaptée aux niveaux et besoins",
  "Nouveau test en fin de formation",
  "Questionnaire de satisfaction",
] as const;

const FORMATIONS = [
  {
    icon: Users,
    title: "Groupes de 8 personnes",
    text: "Chaque stagiaire participe activement, sans se noyer dans la masse.",
  },
  {
    icon: GraduationCap,
    title: "Un formateur dédié",
    text: "Mise en situation directement liée à votre métier : ski, accueil, remontées.",
  },
  {
    icon: Wallet,
    title: "Financement facilité",
    text: "FIFPL, OPCO : FLI gère le dossier administratif pour vous.",
  },
  {
    icon: Laptop,
    title: "Présentiel ou en ligne",
    text: "Cours individuels, en binôme, ou stages intensifs — à la demande.",
  },
  {
    icon: Award,
    title: "Formation certifiante",
    text: "Centre agréé Linguaskill et Bright.",
  },
  {
    icon: ChartLine,
    title: "Progression mesurée",
    text: "Test d'entrée et de sortie, résultats transmis à votre école de ski.",
  },
] as const;

/**
 * FAQ par thèmes. Sources : conditions générales de formation
 * (`src/lib/conditions-generales-content.ts`), sessions 2026-2027
 * (`docs/SESSIONS_2026_2027.md`) et critères FIF PL (`src/lib/fifpl-funding.ts`).
 * Aucun tarif de stage ici : il dépend de l'école et s'affiche sur le formulaire.
 */
const FAQ_GROUPS = [
  {
    title: "Avant de m'inscrire",
    items: [
      {
        q: "À qui s'adressent les formations FLI ?",
        a: "Aux professionnels de la montagne : moniteurs et monitrices de ski (ESF ou indépendants), pisteurs-secouristes, personnel des remontées mécaniques, hôtellerie et restauration d'altitude. Les groupes sont constitués par niveau et par métier, pour travailler les situations que vous vivez vraiment en saison.",
      },
      {
        q: "Quelles langues proposez-vous ?",
        a: "Cette saison : anglais, espagnol, néerlandais, portugais brésilien et russe, en station ou en ligne. D'autres langues peuvent être organisées pour un groupe à partir de 6 personnes — contactez-nous.",
      },
      {
        q: "Je débute complètement, c'est fait pour moi ?",
        a: "Oui. Le test de niveau passé à l'inscription nous permet de vous placer dans un groupe homogène, quel que soit votre point de départ. Si votre niveau est isolé par rapport aux autres inscrits, nous vous proposons une alternative adaptée (autre session, autre lieu, cours individuel en ligne) plutôt qu'un groupe qui ne vous conviendrait pas.",
      },
      {
        q: "Comment se déroule un stage en station ?",
        a: "Une semaine de 24 heures, du lundi au vendredi, dans votre station ou à proximité. Les groupes de 8 personnes sont répartis entre le matin et l'après-midi : l'équipe FLI vous attribue votre créneau environ 10 jours avant le début, après analyse de l'ensemble des inscrits. Test de niveau à l'entrée et à la sortie, feuille d'émargement, questionnaire de satisfaction.",
      },
      {
        q: "Je ne peux pas me déplacer : quelles solutions en ligne ?",
        a: "Deux formats. Les stages collectifs en visio : 24 heures en 8 séances de 3 heures, deux soirs par semaine, en petit groupe de 4 à 8 personnes. Et les cours individuels en ligne, par packs de 3 heures (6 à 18 heures), que vous planifiez à votre rythme avec votre formateur ou formatrice.",
      },
    ],
  },
  {
    title: "Inscription et financement",
    items: [
      {
        q: "Comment s'inscrire ?",
        a: "Depuis le formulaire en ligne : vous choisissez votre langue, votre lieu et vos dates, puis vous passez le test de niveau (obligatoire). Votre inscription est confirmée par un code d'inscription ; la convention de formation et le programme vous sont ensuite adressés, à vous ou à votre employeur.",
      },
      {
        q: "Comment se passe le règlement ?",
        a: "Au choix à l'étape « Paiement » : des frais de dossier de 150 €, déduits du tarif total, puis le solde avant le début de la formation ; ou le paiement intégral, en ligne ou par virement. Le tarif de votre session, qui dépend de votre école, est affiché sur le récapitulatif avant validation. FLI est exonérée de TVA.",
      },
      {
        q: "Puis-je faire financer ma formation ?",
        a: "Oui. Moniteurs et monitrices indépendants : les langues sont une formation « cœur de métier » pour le FIF PL, prise en charge jusqu'à 900 € par an (nos visios comptent comme du présentiel). Salariés : votre OPCO peut financer la formation. Dans les deux cas, FLI vous aide à estimer vos droits et prépare les documents du dossier.",
      },
      {
        q: "Et si je dois annuler ?",
        a: "Vous disposez de 10 jours après la signature de la convention pour vous rétracter par lettre recommandée, sans qu'aucune somme ne soit due. Pour les cours individuels en ligne, un cours s'annule jusqu'à 24 heures avant ; passé ce délai, il est facturé. En cas d'annulation d'une session par FLI, seules les heures effectivement suivies sont dues.",
      },
    ],
  },
  {
    title: "Pendant et après",
    items: [
      {
        q: "Quels documents vais-je recevoir ?",
        a: "Avant la formation : convention et programme. Pendant : feuille d'émargement. À l'issue : attestation de stage, résultats de vos tests d'entrée et de sortie, et facture. Si vous le souhaitez, vos résultats sont transmis à votre école de ski.",
      },
      {
        q: "Mon école de ski peut-elle organiser un stage sur place ?",
        a: "Oui, c'est le cas de la plupart de nos sessions en station : FLI fournit le formateur ou la formatrice et gère l'organisation, l'école met à disposition une salle et, selon les cas, l'hébergement. Un forfait école est possible. Demandez-nous un devis.",
      },
      {
        q: "Et si j'ai un handicap ou besoin d'un aménagement ?",
        a: "Parlez-en dès l'inscription à notre référente handicap, Paula Rangel Halbwachs. Nos formations en ligne sont accessibles aux personnes à mobilité réduite ; en station, les locaux sont ceux de nos partenaires. Nous étudions avec vous les adaptations possibles ou vous orientons vers un organisme adapté.",
      },
      {
        q: "FLI est-elle certifiée Qualiopi ?",
        a: "Oui, France Langues International est certifiée Qualiopi au titre des actions de formation. C'est la condition pour que votre formation soit financée par le FIF PL, un OPCO ou un autre financeur public.",
      },
    ],
  },
] as const;

interface LanguageSessionsGroup {
  key: string;
  label: string;
  sessions: RegistrationOffering[];
}

/** Stages à dates fixes (présentiel + en ligne groupe), regroupés par langue — hors individuel à la demande. */
function groupSessionsByLanguage(offerings: RegistrationOffering[]): LanguageSessionsGroup[] {
  const scheduled = offerings.filter(
    (o) => o.modality_key !== "online_individual" && isOpenOffering(o)
  );
  const groups = new Map<string, LanguageSessionsGroup>();
  for (const offering of scheduled) {
    const existing = groups.get(offering.language_key);
    if (existing) {
      existing.sessions.push(offering);
    } else {
      groups.set(offering.language_key, {
        key: offering.language_key,
        label: offering.language_label,
        sessions: [offering],
      });
    }
  }
  for (const group of groups.values()) {
    group.sessions = sortOfferingsByDateThenLocation(group.sessions);
  }
  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

/** « Présentiel · 24 h » / « En ligne (visio) · 24 h » — court, pour la tuile de session. */
function formatSessionFormat(
  session: Pick<RegistrationOffering, "modality_key" | "duration_hours">
): string {
  const modality = session.modality_key === "in_person" ? "Présentiel" : "En ligne (visio)";
  return session.duration_hours > 0 ? `${modality} · ${session.duration_hours} h` : modality;
}

/**
 * Landing institutionnelle publique — conforme `docs/FLI-LP-institucional-spec.md`.
 * `/` = LP ; `/auth` = login inchangé ; CTA « Accès FLI ».
 */
export default function InstitutionalLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactIntent, setContactIntent] = useState<ContactDialogIntent | null>(null);
  const { data: offerings = [], isLoading: offeringsLoading } = useRegistrationOfferings();
  const sessionsByLanguage = useMemo(() => groupSessionsByLanguage(offerings), [offerings]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="lp-root flex min-h-screen flex-col bg-[hsl(var(--surface-page))] text-[hsl(var(--foreground))] antialiased">
      <style>{`
        .lp-root { font-family: "Outfit", ui-sans-serif, system-ui, sans-serif; }
        /* Titres : même police que le texte courant, graisse 700 — lisible et sans effet de style (Paula, 21/10). */
        .lp-display { font-family: "Outfit", ui-sans-serif, system-ui, sans-serif; font-weight: 700; letter-spacing: -0.01em; }
        @keyframes lp-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .lp-float { animation: lp-float 4.5s ease-in-out infinite; }
        .lp-float-delay { animation-delay: 1.2s; }
      `}</style>

      {/* —— Menu fixe —— */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-border/80 bg-[hsl(var(--surface-raised)/0.92)] shadow-sm backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:px-6">
          <a href="#inicio" className="flex shrink-0 items-center" aria-label="FLI — accueil">
            <img
              src={RECOMMENDED.navLogo}
              alt="France Langues International"
              className="h-8 w-auto sm:h-9"
            />
          </a>

          <nav
            className={`hidden items-center gap-7 text-sm font-medium md:flex ${
              scrolled
                ? "text-[hsl(var(--fli-dark))]"
                : "text-white/85"
            }`}
          >
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  scrolled
                    ? "hover:text-[hsl(var(--fli-orange))]"
                    : "hover:text-[hsl(var(--fli-yellow))]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--fli-yellow))] px-4 py-2 text-sm font-semibold text-[hsl(var(--fli-navy))] shadow-sm transition hover:brightness-105"
            >
              Accès FLI
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden ${
                scrolled
                  ? "border-border text-foreground"
                  : "border-white/25 text-white"
              }`}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-border bg-[hsl(var(--surface-raised))] px-4 py-3 md:hidden">
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={closeMenu}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      <main className="flex-1">
        {/* —— Section 1 : tête de page —— fond gris foncé uni, sans photo de fond */}
        <section
          id="inicio"
          className="relative overflow-hidden bg-[#2c2c2e] pt-16 text-white sm:pt-[4.25rem]"
        >
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-8 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8 lg:pb-6 lg:pt-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--fli-yellow))]">
                France Langues International
              </p>
              <h1 className="lp-display mt-4 max-w-xl text-3xl leading-[1.15] text-white sm:text-4xl lg:text-[2.75rem]">
                Formez-vous dans la langue de votre métier, sans sacrifier votre saison.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                France Langues International conçoit des formations linguistiques sur mesure pour
                les moniteur·rices de ski, le personnel des remontées mécaniques, les pisteur·euses
                et l&apos;hôtellerie de montagne.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#formacoes"
                  className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--fli-yellow))] px-6 py-3 text-base font-semibold text-[hsl(var(--fli-navy))] transition hover:brightness-105"
                >
                  Réserver mon stage
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </a>
                <a
                  href="#metodo"
                  className="text-sm font-semibold text-white/90 underline-offset-4 transition hover:text-[hsl(var(--fli-yellow))] hover:underline"
                >
                  Découvrir la méthode
                </a>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-md justify-center lg:max-w-none">
              <img
                src={RECOMMENDED.heroCharacter}
                alt="Moniteur de ski en formation FLI"
                className="relative z-10 max-h-[min(70vh,560px)] w-auto object-contain"
              />

              <div className="lp-float absolute left-0 top-10 z-20 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[hsl(var(--fli-navy))] shadow-lg sm:text-sm">
                {BADGES[0]}
              </div>
              <div className="lp-float lp-float-delay absolute right-0 top-1/3 z-20 rounded-full bg-[hsl(var(--fli-yellow))] px-3.5 py-2 text-xs font-semibold text-[hsl(var(--fli-navy))] shadow-lg sm:text-sm">
                {BADGES[1]}
              </div>
              <div className="lp-float absolute bottom-12 left-2 z-20 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[hsl(var(--fli-navy))] shadow-lg sm:left-4 sm:text-sm">
                {BADGES[2]}
              </div>
            </div>
          </div>

          {/* Barre d'indicateurs */}
          <div className="relative border-t border-white/10 bg-[#1f1f21]">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
              {INDICATORS.map((item) => (
                <div key={item.value} className="px-4 py-5 text-center sm:py-6">
                  <p className="lp-display text-xl text-[hsl(var(--fli-yellow))] sm:text-2xl">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-white/70 sm:text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* —— Section 2 : méthode / vidéo —— */}
        <section id="metodo" className="scroll-mt-24 bg-[hsl(var(--surface-raised))]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
            <div>
              <h2 className="lp-display text-3xl text-[hsl(var(--fli-navy))] sm:text-4xl">
                Découvrez comment se déroule votre formation
              </h2>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Un parcours structuré, testé sur plus de 500 sessions.
              </p>
              <ol className="mt-8 space-y-3">
                {METHOD_STEPS.map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm sm:text-base">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--fli-yellow))] text-xs font-bold text-[hsl(var(--fli-navy))]">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-foreground/90">{step}</span>
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => setVideoReady(true)}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--fli-navy))] underline-offset-4 hover:underline"
              >
                <Play className="h-4 w-4 fill-current text-[hsl(var(--fli-orange))]" aria-hidden />
                Regarder la vidéo
              </button>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-black shadow-lg">
              <div className="aspect-video w-full">
                {videoReady ? (
                  <iframe
                    title={YOUTUBE_TITLE}
                    src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0`}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setVideoReady(true)}
                    className="group relative h-full w-full"
                    aria-label={`Regarder la vidéo : ${YOUTUBE_TITLE}`}
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:opacity-95"
                    />
                    <span className="absolute inset-0 bg-[hsl(var(--fli-navy)/0.35)]" />
                    <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[hsl(var(--fli-yellow))] text-[hsl(var(--fli-navy))] shadow-md transition group-hover:scale-105">
                      <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* —— Section formations —— */}
        <section id="formacoes" className="scroll-mt-24 bg-[hsl(var(--surface-page))]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="lp-display text-3xl text-[hsl(var(--fli-navy))] sm:text-4xl">
                Des formations pensées pour votre métier
              </h2>
              <p className="mt-3 text-muted-foreground">
                Six différenciateurs qui structurent l&apos;expérience FLI, du premier test au
                suivi post-stage.
              </p>
            </div>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FORMATIONS.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-raised))] p-6 shadow-xs"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--fli-yellow)/0.25)] text-[hsl(var(--fli-navy))]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="lp-display mt-4 text-lg text-[hsl(var(--fli-navy))]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>

            {/* Bandeau CTA */}
            <div className="mt-14 overflow-hidden rounded-[var(--radius-panel)] bg-[hsl(var(--fli-yellow))] px-6 py-10 text-[hsl(var(--fli-navy))] sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-8">
              <div className="max-w-xl">
                <h3 className="lp-display text-2xl text-[hsl(var(--fli-navy))] sm:text-3xl">
                  Organisez la formation linguistique de votre équipe, sans complexité
                  administrative
                </h3>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--fli-navy))] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[hsl(219_52%_22%)]"
                >
                  Je réserve mon stage
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => setContactIntent("devis")}
                  className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--fli-navy)/0.35)] px-6 py-3 text-sm font-semibold transition hover:bg-[hsl(var(--fli-navy)/0.08)]"
                >
                  Demander un devis
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* —— Section stages : par langue, lieux et dates, catalogue public /register */}
        <section id="stages" className="scroll-mt-24 bg-[hsl(var(--surface-raised))]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="lp-display text-3xl text-[hsl(var(--fli-navy))] sm:text-4xl">
                Nos prochains stages, par langue
              </h2>
              <p className="mt-3 text-muted-foreground">
                Lieux et dates des sessions ouvertes à l&apos;inscription cette saison. Le
                catalogue complet, avec les tarifs selon votre école, est disponible sur le
                formulaire d&apos;inscription.
              </p>
            </div>

            {offeringsLoading ? (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-44 rounded-[var(--radius-card)]" />
                ))}
              </div>
            ) : sessionsByLanguage.length > 0 ? (
              <div className="mt-10 space-y-8">
                {sessionsByLanguage.map((group) => (
                  <div key={group.key}>
                    <div className="flex items-baseline gap-3 border-b border-border pb-3">
                      <h3 className="lp-display text-xl text-[hsl(var(--fli-navy))]">
                        {group.label}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {group.sessions.length}{" "}
                        {group.sessions.length > 1 ? "sessions" : "session"}
                      </span>
                    </div>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.sessions.map((session) => (
                        <li
                          key={session.id}
                          className="flex flex-col rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-page))] px-4 py-3.5 text-sm shadow-xs"
                        >
                          <p className="flex items-start gap-1.5 font-semibold leading-snug text-foreground">
                            <MapPin
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--fli-orange))]"
                              aria-hidden
                            />
                            {session.location_label}
                          </p>
                          <p className="mt-1.5 flex items-start gap-1.5 leading-snug text-muted-foreground">
                            <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                            {session.date_label || "Dates à confirmer"}
                          </p>
                          <p className="mt-auto pt-2 text-xs text-muted-foreground/80">
                            {formatSessionFormat(session)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-10 text-sm text-muted-foreground">
                Le calendrier des prochains stages est en cours de mise à jour — consultez le
                formulaire d&apos;inscription pour les dates disponibles.
              </p>
            )}

            <div className="mt-10">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--fli-yellow))] px-6 py-3 text-sm font-semibold text-[hsl(var(--fli-navy))] transition hover:brightness-105"
              >
                Voir le calendrier complet et m&apos;inscrire
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* —— FAQ —— */}
        <section id="faq" className="scroll-mt-24 bg-[hsl(var(--surface-raised))]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
          <div>
            <h2 className="lp-display text-3xl text-[hsl(var(--fli-navy))] sm:text-4xl">
              Une question ?
            </h2>
            <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-page))] p-6">
              <p className="font-semibold text-[hsl(var(--fli-navy))]">
                Vous n&apos;avez pas trouvé votre réponse ?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Écrivez-nous ou appelez l&apos;équipe FLI — nous répondons rapidement.
              </p>
              <button
                type="button"
                onClick={() => setContactIntent("question")}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--fli-yellow))] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--fli-navy))] transition hover:brightness-105"
              >
                Nous contacter
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="mt-3 text-xs text-muted-foreground">
                info@fli.fr · 04 79 28 21 09
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {FAQ_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--fli-orange))]">
                  {group.title}
                </p>
                <Accordion type="single" collapsible className="mt-2 w-full">
                  {group.items.map((item) => (
                    <AccordionItem key={item.q} value={item.q}>
                      <AccordionTrigger className="text-left text-sm font-semibold text-[hsl(var(--fli-navy))] sm:text-base">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>

      <footer className="mt-auto border-t border-border bg-[hsl(var(--fli-navy))] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <img src={RECOMMENDED.navLogo} alt="FLI" className="h-9 w-auto" />
            <p className="mt-4 max-w-md text-sm text-white/70">
              Centre de formation professionnelle pour les moniteurs de ski et les professionnels
              de la montagne.
            </p>
            <img
              src={qualiopiCertification}
              alt="Qualiopi, processus certifié. La certification qualité a été délivrée au titre de la catégorie d'action suivante : Actions de formation."
              className="mt-6 h-auto w-full max-w-md rounded-lg bg-white p-3"
            />
          </div>
          <div className="space-y-3 text-sm text-white/80">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[hsl(var(--fli-yellow))]" aria-hidden />
              <a href="mailto:info@fli.fr" className="hover:text-[hsl(var(--fli-yellow))]">
                info@fli.fr
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[hsl(var(--fli-yellow))]" aria-hidden />
              <a href="tel:+33479282109" className="hover:text-[hsl(var(--fli-yellow))]">
                04 79 28 21 09
              </a>
            </p>
            <p className="text-white/60">
              25, avenue de la Gare
              <br />
              73800 Montmélian
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-white/50">
              <Link to="/conditions-generales" className="hover:text-white/80">
                Conditions générales
              </Link>
              <Link to="/mockup/lp-assets" className="hover:text-white/80">
                Validation des visuels
              </Link>
              <Link to="/auth" className="hover:text-white/80">
                Accès FLI
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/45">
          © {new Date().getFullYear()} France Langues International
        </div>
      </footer>

      <ContactDialog intent={contactIntent} onClose={() => setContactIntent(null)} />
    </div>
  );
}
