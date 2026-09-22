import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail, MapPin, Phone, Play } from "lucide-react";
import {
  RECOMMENDED,
  YOUTUBE_TITLE,
  YOUTUBE_VIDEO_ID,
} from "@/components/landing/landing-assets";

const LANGUAGES = [
  "Anglais",
  "Russe",
  "Néerlandais",
  "Espagnol",
  "Portugais-Brésilien",
  "Allemand",
  "Italien",
  "Chinois",
  "Français Langue Étrangère",
];

const TESTIMONIALS = [
  {
    quote:
      "Formation totalement adaptée à notre niveau et à mes attentes — les horaires, le lieu, le contenu et la forme des cours.",
    author: "Moniteur, ESF Courchevel 1850",
    detail: "portugais brésilien",
  },
  {
    quote:
      "Beaucoup d’oral, très interactif, avec un vocabulaire vraiment utile pour les cours de ski.",
    author: "Moniteur, Val Cenis",
    detail: "néerlandais",
  },
  {
    quote:
      "Petit groupe, on participe sans complexes, et on met tout de suite en application sur les skis. Super.",
    author: "Moniteur, ESF Valmorel",
    detail: "portugais brésilien",
  },
];

function useInView<T extends HTMLElement>(margin = "0px 0px -10% 0px") {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: margin, threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [margin]);
  return { ref, visible };
}

/**
 * Landing institutionnelle publique — ouverture de la plateforme FLI.
 * Mise à jour de stages-langues.fr + CTA Accéder à la plateforme.
 */
export default function InstitutionalLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const hero = useInView<HTMLElement>();
  const about = useInView<HTMLElement>();
  const platform = useInView<HTMLElement>();
  const video = useInView<HTMLElement>();
  const voices = useInView<HTMLElement>();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp-root min-h-screen bg-[hsl(219_52%_10%)] text-[hsl(40_30%_96%)] antialiased">
      <style>{`
        .lp-root {
          font-family: "Outfit", "Segoe UI", sans-serif;
        }
        .lp-display {
          font-family: "Syne", "Outfit", sans-serif;
        }
        @keyframes lp-rise {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-drift {
          from { opacity: 0; transform: translateX(36px) scale(0.96); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes lp-glow {
          0%, 100% { box-shadow: 0 0 0 0 hsl(40 97% 54% / 0.35); }
          50% { box-shadow: 0 0 0 12px hsl(40 97% 54% / 0); }
        }
        .lp-rise { animation: lp-rise 0.85s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .lp-drift { animation: lp-drift 1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both; }
        .lp-cta-pulse { animation: lp-glow 2.4s ease-in-out infinite; }
        .lp-delay-1 { animation-delay: 0.12s; }
        .lp-delay-2 { animation-delay: 0.28s; }
        .lp-delay-3 { animation-delay: 0.42s; }
      `}</style>

      {/* —— Header —— */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-[hsl(219_52%_10%_/0.92)] backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6">
          <a href="#top" className="flex items-center gap-3" aria-label="FLI — accueil">
            <img
              src={RECOMMENDED.navLogo}
              alt="France Langues International"
              className="h-9 w-auto sm:h-10"
            />
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <a href="#formations" className="transition hover:text-[#FCAF17]">
              Formations
            </a>
            <a href="#plateforme" className="transition hover:text-[#FCAF17]">
              Plateforme
            </a>
            <a href="#video" className="transition hover:text-[#FCAF17]">
              En images
            </a>
            <a href="#temoignages" className="transition hover:text-[#FCAF17]">
              Ils en parlent
            </a>
            <a href="#contact" className="transition hover:text-[#FCAF17]">
              Contact
            </a>
          </nav>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-[#FCAF17] px-4 py-2 text-sm font-semibold text-[#14213D] transition hover:brightness-110"
          >
            Accéder à la plateforme
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </header>

      {/* —— Hero —— */}
      <section
        id="top"
        ref={hero.ref}
        className="relative isolate min-h-[100svh] overflow-hidden"
      >
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url(${RECOMMENDED.atmosphereBg})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[hsl(219_52%_8%_/0.88)] via-[hsl(219_45%_14%_/0.78)] to-[hsl(27_70%_20%_/0.55)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-40 [background-image:radial-gradient(ellipse_at_20%_20%,hsl(40_97%_54%_/0.18),transparent_45%),radial-gradient(ellipse_at_80%_70%,hsl(199_100%_43%_/0.12),transparent_40%)]"
          aria-hidden
        />

        <div className="relative mx-auto grid min-h-[100svh] max-w-6xl items-end gap-8 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-20 lg:pt-24">
          <div className={hero.visible ? "lp-rise" : "opacity-0"}>
            <img
              src={RECOMMENDED.heroLogo}
              alt="FLI — France Langues International"
              className="mb-6 h-14 w-auto max-w-[min(100%,22rem)] object-contain sm:h-16"
            />
            <p className="lp-display text-sm font-semibold uppercase tracking-[0.22em] text-[#FCAF17]">
              France Langues International
            </p>
            <h1 className="lp-display mt-3 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.35rem]">
              Formations en langues pour les professionnels de la montagne
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
              Cours en groupe ou individualisés, adaptés à votre métier, votre niveau et votre
              emploi du temps — moniteur·rices, remontées, piste, hôtellerie et accueil en
              station.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                className="lp-cta-pulse inline-flex items-center gap-2 rounded-full bg-[#FCAF17] px-6 py-3 text-base font-semibold text-[#14213D] transition hover:brightness-110"
              >
                Accéder à la plateforme
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-medium text-white transition hover:border-white/60 hover:bg-white/5"
              >
                Nous contacter
              </a>
            </div>
          </div>

          <div
            className={`relative flex justify-center lg:justify-end ${
              hero.visible ? "lp-drift" : "opacity-0"
            }`}
          >
            <img
              src={RECOMMENDED.heroCharacter}
              alt="Moniteur de ski FLI"
              className="relative z-10 max-h-[min(72vh,640px)] w-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>
      </section>

      {/* —— Formations —— */}
      <section
        id="formations"
        ref={about.ref}
        className="relative overflow-hidden border-t border-white/10 bg-[hsl(219_48%_12%)]"
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className={about.visible ? "lp-rise" : "opacity-0"}>
            <h2 className="lp-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Des formations sur mesure pour le milieu montagnard
            </h2>
            <p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">
              France Langues International conçoit des formations linguistiques pour les acteurs
              de la montagne. Nos formateurs apportent une pédagogie participative et un
              vocabulaire utile dès la piste et l’accueil.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <li
                  key={lang}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-white/85"
                >
                  {lang}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-white/55">
              Cours de langues en groupe ou individualisés · évaluations de niveau
            </p>
          </div>
          <div
            className={`flex justify-center ${about.visible ? "lp-drift lp-delay-1" : "opacity-0"}`}
          >
            <img
              src={RECOMMENDED.formationsCharacter}
              alt="Professionnelle de la montagne FLI"
              className="max-h-[420px] w-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* —— Plateforme CTA —— */}
      <section
        id="plateforme"
        ref={platform.ref}
        className="relative border-t border-white/10 bg-gradient-to-br from-[hsl(40_97%_54%)] via-[hsl(36_95%_50%)] to-[hsl(27_91%_48%)] text-[#14213D]"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div
            className={`order-2 flex justify-center lg:order-1 ${
              platform.visible ? "lp-rise" : "opacity-0"
            }`}
          >
            <img
              src={RECOMMENDED.platformCharacter}
              alt="Accès à la plateforme FLI"
              className="max-h-[380px] w-auto object-contain"
            />
          </div>
          <div
            className={`order-1 lg:order-2 ${platform.visible ? "lp-rise lp-delay-1" : "opacity-0"}`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#14213D]/70">
              Nouvelle plateforme
            </p>
            <h2 className="lp-display mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Votre espace FLI est ouvert
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#14213D]/85 sm:text-lg">
              Inscriptions, planning, documents, évaluations et suivi de formation — tout est
              centralisé pour les stagiaires, formateurs et l’équipe FLI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-[#14213D] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#1c2d4f]"
              >
                Ouvrir la plateforme
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                to="/auth?mode=student"
                className="inline-flex items-center gap-2 rounded-full border border-[#14213D]/35 px-6 py-3 text-base font-semibold text-[#14213D] transition hover:bg-[#14213D]/8"
              >
                Espace stagiaire
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-[#14213D]/80 underline-offset-4 hover:underline"
              >
                S’inscrire à une formation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* —— Vidéo —— */}
      <section
        id="video"
        ref={video.ref}
        className="border-t border-white/10 bg-[hsl(219_52%_9%)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className={video.visible ? "lp-rise" : "opacity-0"}>
            <h2 className="lp-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              En images
            </h2>
            <p className="mt-3 max-w-2xl text-white/70">
              {YOUTUBE_TITLE} — un aperçu de la vie des stages FLI en station.
            </p>
          </div>
          <div
            className={`relative mt-10 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] ${
              video.visible ? "lp-rise lp-delay-2" : "opacity-0"
            }`}
          >
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
                  aria-label={`Lire la vidéo : ${YOUTUBE_TITLE}`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${YOUTUBE_VIDEO_ID}/hqdefault.jpg`}
                    alt=""
                    className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#FCAF17] text-[#14213D] shadow-lg transition group-hover:scale-105">
                    <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* —— Témoignages —— */}
      <section
        id="temoignages"
        ref={voices.ref}
        className="border-t border-white/10 bg-[hsl(219_45%_13%)]"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2
            className={`lp-display text-3xl font-bold tracking-tight text-white sm:text-4xl ${
              voices.visible ? "lp-rise" : "opacity-0"
            }`}
          >
            Ils en parlent
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <blockquote
                key={t.author}
                className={`border-l-2 border-[#FCAF17] pl-5 ${
                  voices.visible ? `lp-rise lp-delay-${i + 1}` : "opacity-0"
                }`}
              >
                <p className="text-base leading-relaxed text-white/85">« {t.quote} »</p>
                <footer className="mt-4 text-sm text-white/55">
                  — {t.author}{" "}
                  <span className="text-[#FCAF17]/90">({t.detail})</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* —— Contact —— */}
      <section id="contact" className="border-t border-white/10 bg-[hsl(219_52%_10%)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="lp-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Contactez-nous
            </h2>
            <p className="mt-4 text-white/70">
              Une question sur une formation, un devis, un dossier de financement ? Écrivez-nous
              ou appelez l’équipe FLI.
            </p>
            <ul className="mt-8 space-y-4 text-white/85">
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#FCAF17]" aria-hidden />
                <a className="hover:text-[#FCAF17]" href="mailto:info@fli.fr">
                  info@fli.fr
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#FCAF17]" aria-hidden />
                <a className="hover:text-[#FCAF17]" href="tel:+33479282109">
                  04 79 28 21 09
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FCAF17]" aria-hidden />
                <span>
                  25, avenue de la Gare
                  <br />
                  73800 Montmélian
                </span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-8">
            <img
              src={RECOMMENDED.markIcon}
              alt=""
              className="mb-4 h-16 w-16 object-contain"
              aria-hidden
            />
            <p className="lp-display text-xl font-bold text-white">
              Centre de formation professionnelle
            </p>
            <p className="mt-2 text-sm text-white/65">
              Pour les moniteurs de ski et les professionnels de la montagne.
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#FCAF17] px-5 py-2.5 text-sm font-semibold text-[#14213D] transition hover:brightness-110"
            >
              Accéder à la plateforme
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/mockup/lp-assets"
              className="mt-4 text-xs text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
            >
              Validation logos & illustrations
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} France Langues International</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/conditions-generales" className="hover:text-white/80">
              Conditions générales
            </Link>
            <a
              href="https://www.facebook.com/francelangues/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white/80"
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/flifrancelangues/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white/80"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
