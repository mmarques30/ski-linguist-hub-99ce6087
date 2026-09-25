import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  ChartLine,
  GraduationCap,
  Laptop,
  Mail,
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
import {
  RECOMMENDED,
  YOUTUBE_TITLE,
  YOUTUBE_VIDEO_ID,
} from "@/components/landing/landing-assets";

const NAV = [
  { label: "Nosso Método", href: "#metodo" },
  { label: "Parceiros", href: "#parceiros" },
  { label: "Formações", href: "#formacoes" },
  { label: "FAQ", href: "#faq" },
] as const;

const INDICATORS = [
  { value: "87 %", label: "stagiaires satisfait·es ou très satisfait·es" },
  { value: "0,6 %", label: "taux d'abandon" },
  { value: "4,72 / 5", label: "qualité d'animation" },
  { value: "Depuis 2018", label: "formations montagne" },
] as const;

const BADGES = ["Groupes de 6 max", "Financement FIFPL", "Certifié Qualiopi"] as const;

const METHOD_STEPS = [
  "Test de niveau à l'inscription",
  "Objectifs définis avec le groupe",
  "Formation adaptée aux niveaux et besoins",
  "Nouveau test en fin de formation",
  "Questionnaire de satisfaction",
] as const;

const PARTNERS = [
  "Réseau ESF",
  "Courchevel 1850",
  "Val Cenis",
  "Valmorel",
  "St Sorlin d'Arves",
  "La Rosière",
  "Saint-Gervais",
  "La Clusaz",
  "Piau Engaly",
  "Qualiopi",
  "FIFPL / OPCO",
  "Linguaskill",
  "Bright",
] as const;

const FORMATIONS = [
  {
    icon: Users,
    title: "Groupes de 6 maximum",
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
    text: "Centre agréé Linguaskill et Bright, éligible Qualiopi.",
  },
  {
    icon: ChartLine,
    title: "Progression mesurée",
    text: "Test d'entrée et de sortie, résultats transmis à votre école de ski.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Je n'ai jamais suivi de formation en langues, c'est fait pour moi ?",
    a: "Oui. Un test de niveau à l'inscription permet de vous placer dans le bon groupe, quel que soit votre point de départ.",
  },
  {
    q: "Et si mon niveau ne correspond pas aux autres inscrits ?",
    a: "Nous vous orientons vers une alternative adaptée (autre groupe, cours individuel) plutôt que de vous imposer un format inadapté.",
  },
  {
    q: "Puis-je concilier la formation avec ma saison de ski ?",
    a: "Oui : stages intensifs en automne, cours individuels ou en ligne à la demande toute l'année.",
  },
  {
    q: "Le coût est-il élevé ?",
    a: "750 €/personne pour un stage intensif de 20h. Le FIFPL peut financer jusqu'à 900 €/an pour les formations individuelles.",
  },
  {
    q: "Et si je dois annuler mon inscription ?",
    a: "Les frais de dossier (150 €) sont remboursables en cas d'annulation justifiée ou d'insuffisance de participants, sous 7 jours après inscription.",
  },
  {
    q: "Faut-il déjà avoir le BE (Brevet d'État) pour s'inscrire ?",
    a: "Oui pour le stage moniteurs de ski — être titulaire du BE ou en formation.",
  },
  {
    q: "Combien de temps avant de commencer les cours ?",
    a: "Les inscriptions se clôturent 7 jours avant le début du stage ; au-delà, nous contacter directement selon les places restantes.",
  },
  {
    q: "Puis-je suivre une formation tout en étant en poste ?",
    a: "Oui, les formules individuelles en ligne (6h à 18h) s'organisent à votre rythme.",
  },
  {
    q: "Ça fonctionne dans toutes les stations ?",
    a: "Nous intervenons dans l'ensemble du réseau ESF et auprès des stations partenaires ; contactez-nous pour organiser une formation dans votre station.",
  },
  {
    q: "Et si j'ai un handicap ou besoin d'un aménagement ?",
    a: "Parlez-en dès l'inscription à notre référente handicap, Paula Rangel Halbwachs — nous étudions ensemble les adaptations possibles, avec l'appui du réseau RHF.",
  },
  {
    q: "Quel suivi est proposé pendant et après la formation ?",
    a: "Test de progression en fin de stage, questionnaire de satisfaction, et transmission des résultats à votre école de ski.",
  },
] as const;

/**
 * Landing institutionnelle publique — conforme `docs/FLI-LP-institucional-spec.md`.
 * `/` = LP ; `/auth` = login inchangé ; CTA « Acesso FLI ».
 */
export default function InstitutionalLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="lp-root min-h-screen bg-[hsl(var(--surface-page))] text-[hsl(var(--foreground))] antialiased">
      <style>{`
        .lp-root { font-family: "Outfit", ui-sans-serif, system-ui, sans-serif; }
        .lp-display { font-family: "Syne", "Outfit", sans-serif; }
        @keyframes lp-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .lp-marquee-track {
          display: flex;
          width: max-content;
          animation: lp-marquee 40s linear infinite;
        }
        .lp-marquee-track:hover { animation-play-state: paused; }
        @keyframes lp-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .lp-float { animation: lp-float 4.5s ease-in-out infinite; }
        .lp-float-delay { animation-delay: 1.2s; }
      `}</style>

      {/* —— Header sticky —— */}
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
              Acesso FLI
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

      <main>
        {/* —— Dobra 1 : Hero —— fond gris foncé uni, sans photo de fond */}
        <section
          id="inicio"
          className="relative overflow-hidden bg-[#2c2c2e] pt-16 text-white sm:pt-[4.25rem]"
        >
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-8 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8 lg:pb-6 lg:pt-16">
            <div>
              <p className="lp-display text-xs font-semibold uppercase tracking-[0.22em] text-[hsl(var(--fli-yellow))]">
                France Langues International
              </p>
              <h1 className="lp-display mt-4 max-w-xl text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
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
                  <p className="lp-display text-xl font-bold text-[hsl(var(--fli-yellow))] sm:text-2xl">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-white/70 sm:text-sm">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* —— Dobra 2 : Méthode / Vidéo —— */}
        <section id="metodo" className="scroll-mt-24 bg-[hsl(var(--surface-raised))]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-20">
            <div>
              <h2 className="lp-display text-3xl font-bold tracking-tight text-[hsl(var(--fli-navy))] sm:text-4xl">
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

        {/* —— Dobra 3 : Parceiros —— */}
        <section
          id="parceiros"
          className="scroll-mt-24 overflow-hidden border-y border-border bg-[hsl(var(--fli-navy))] py-14 text-white"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="lp-display text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Ils nous font confiance
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-white/60">
              Logos partenaires en attente des fichiers HD (spec §7) — noms affichés en
              placeholder.
            </p>
          </div>
          <div className="relative mt-10 mask-[linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="lp-marquee-track gap-4 px-4">
              {[...PARTNERS, ...PARTNERS].map((name, i) => (
                <div
                  key={`${name}-${i}`}
                  className="flex h-14 min-w-[9.5rem] items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-center text-sm font-semibold tracking-wide text-white/80"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* —— Dobra 4 : Formações —— */}
        <section id="formacoes" className="scroll-mt-24 bg-[hsl(var(--surface-page))]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="max-w-2xl">
              <h2 className="lp-display text-3xl font-bold tracking-tight text-[hsl(var(--fli-navy))] sm:text-4xl">
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
                  <h3 className="lp-display mt-4 text-lg font-bold text-[hsl(var(--fli-navy))]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>

            {/* Bandeau CTA */}
            <div className="mt-14 overflow-hidden rounded-[var(--radius-panel)] bg-[hsl(var(--fli-yellow))] px-6 py-10 text-[hsl(var(--fli-navy))] sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-8">
              <div className="max-w-xl">
                <h3 className="lp-display text-2xl font-extrabold tracking-tight sm:text-3xl">
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
                <a
                  href="mailto:info@fli.fr"
                  className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--fli-navy)/0.35)] px-6 py-3 text-sm font-semibold"
                >
                  Demander un devis
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* —— Footer (avant FAQ) —— */}
      <footer className="border-t border-border bg-[hsl(var(--fli-navy))] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <img src={RECOMMENDED.navLogo} alt="FLI" className="h-9 w-auto" />
            <p className="mt-4 max-w-md text-sm text-white/70">
              Centre de formation professionnelle pour les moniteurs de ski et les professionnels
              de la montagne.
            </p>
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
                Validation assets
              </Link>
              <Link to="/auth" className="hover:text-white/80">
                Acesso FLI
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/45">
          © {new Date().getFullYear()} France Langues International
        </div>
      </footer>

      {/* —— Dobra 5 : FAQ (après footer) —— */}
      <section id="faq" className="scroll-mt-24 bg-[hsl(var(--surface-raised))]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
          <div>
            <h2 className="lp-display text-3xl font-bold tracking-tight text-[hsl(var(--fli-navy))] sm:text-4xl">
              Une question ?
            </h2>
            <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-[hsl(var(--surface-page))] p-6">
              <p className="font-semibold text-[hsl(var(--fli-navy))]">
                Vous n&apos;avez pas trouvé votre réponse ?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Écrivez-nous ou appelez l&apos;équipe FLI — nous répondons rapidement.
              </p>
              <a
                href="mailto:info@fli.fr"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--fli-yellow))] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--fli-navy))]"
              >
                Nous contacter
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <p className="mt-3 text-xs text-muted-foreground">
                info@fli.fr · 04 79 28 21 09
              </p>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.q} value={`faq-${i}`}>
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
      </section>
    </div>
  );
}
