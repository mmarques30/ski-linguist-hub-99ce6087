import { Link } from "react-router-dom";
import {
  CHARACTER_CANDIDATES,
  LOGO_CANDIDATES,
  RECOMMENDED,
} from "@/components/landing/landing-assets";

const SPEC_PICKS = [
  {
    role: "Nav / Acesso FLI",
    file: "fli-marca-yellow.png",
    why: "Logo header sticky (spec §4) — déjà en prod app",
  },
  {
    role: "Hero photo (placeholder)",
    file: "fli_personagem_01.png + fli-auth-bg.png",
    why: "Spec §7 : photo pro moniteur à fournir — illustration temporaire",
  },
  {
    role: "Badges flottants",
    file: "texte",
    why: "Groupes de 6 max · Financement FIFPL · Certifié Qualiopi",
  },
  {
    role: "Vidéo #metodo",
    file: "YouTube 1cIivE5ggCk",
    why: "Embed stages-langues (spec §3 dobra 2)",
  },
  {
    role: "Parceiros carousel",
    file: "placeholders texte",
    why: "Logos HD ESF / stations / Qualiopi / FIFPL / Linguaskill / Bright à fournir",
  },
];

/**
 * Mockup validation assets — aligné sur docs/FLI-LP-institucional-spec.md §5–7.
 * Route : /mockup/lp-assets
 */
export default function AssetValidationMockupPage() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b1220]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FCAF17]">
              Spec LP · validation assets
            </p>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Logos & illustrations — FLI-LP-institucional
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="rounded-full bg-[#FCAF17] px-4 py-2 text-sm font-semibold text-[#14213D] transition hover:brightness-110"
            >
              Voir la landing
            </Link>
            <Link
              to="/auth"
              className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              Acesso FLI
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-14 px-4 py-10">
        <section className="rounded-2xl border border-[#FCAF17]/35 bg-[#FCAF17]/10 p-6">
          <h2 className="text-lg font-bold text-[#FCAF17]">
            Aligné sur docs/FLI-LP-institucional-spec.md
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-white/75">
            Sitemap : Hero → Méthode/vidéo → Parceiros → Formações → Footer → FAQ. CTA header
            « Acesso FLI » → <code className="text-[#FCAF17]">/auth</code>. Pendances spec §5–7 :
            photo hero réelle, logos partenaires HD, chiffres moniteurs formés.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {SPEC_PICKS.map((p) => (
              <li
                key={p.role}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-white">{p.role}</p>
                <p className="font-mono text-xs text-[#FCAF17]">{p.file}</p>
                <p className="mt-1 text-white/65">{p.why}</p>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-end gap-6">
            <figure className="text-center">
              <img src={RECOMMENDED.navLogo} alt="" className="mx-auto h-12 object-contain" />
              <figcaption className="mt-2 text-xs text-white/50">Nav</figcaption>
            </figure>
            <figure className="text-center">
              <img
                src={RECOMMENDED.heroCharacter}
                alt=""
                className="mx-auto h-28 object-contain"
              />
              <figcaption className="mt-2 text-xs text-white/50">Hero placeholder</figcaption>
            </figure>
            <figure className="text-center">
              <img
                src={RECOMMENDED.platformCharacter}
                alt=""
                className="mx-auto h-28 object-contain"
              />
              <figcaption className="mt-2 text-xs text-white/50">Dispo (non utilisé hero)</figcaption>
            </figure>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold">Tous les logos ({LOGO_CANDIDATES.length})</h2>
          <p className="mt-1 text-sm text-white/60">
            Fond damier = transparence. Fond noir = matte déjà dans le PNG.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOGO_CANDIDATES.map((asset) => (
              <article
                key={asset.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]"
              >
                <div
                  className={
                    asset.hasBlackMatte
                      ? "flex h-36 items-center justify-center bg-black p-4"
                      : "flex h-36 items-center justify-center p-4 [background-image:linear-gradient(45deg,#222_25%,transparent_25%),linear-gradient(-45deg,#222_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#222_75%),linear-gradient(-45deg,transparent_75%,#222_75%)] [background-position:0_0,0_8px,8px_-8px,-8px_0] [background-size:16px_16px]"
                  }
                >
                  <img
                    src={asset.src}
                    alt={asset.label}
                    className="max-h-28 max-w-full object-contain"
                  />
                </div>
                <div className="space-y-1 border-t border-white/10 px-3 py-3">
                  <p className="font-mono text-xs text-[#FCAF17]">{asset.label}</p>
                  <p className="text-sm text-white/70">{asset.usage}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold">
            Illustrations personnages ({CHARACTER_CANDIDATES.length})
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {CHARACTER_CANDIDATES.map((asset) => (
              <article
                key={asset.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#1a2744] to-[#0b1220]"
              >
                <div className="flex h-72 items-end justify-center px-4 pt-4">
                  <img
                    src={asset.src}
                    alt={asset.label}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-1 border-t border-white/10 px-4 py-3">
                  <p className="font-mono text-xs text-[#FCAF17]">{asset.label}</p>
                  <p className="text-sm text-white/70">{asset.usage}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
