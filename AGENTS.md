# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service front-end app: a Vite + React + TypeScript SPA (shadcn-ui + Tailwind) for **FLI Formation** (France Langues International), a training/school management tool. There is no local backend to run — the app talks to a **hosted Supabase** project configured via `VITE_SUPABASE_*` vars in `.env` (already committed).

Standard commands live in `package.json` (`dev`, `build`, `lint`, `preview`). Notes/caveats:

- Dev server: `npm run dev` serves on `http://localhost:8080` (port/host are fixed in `vite.config.ts`, not the Vite default 5173).
- The package manager is npm (`package-lock.json`). `bun.lock`/`bun.lockb` are also committed but bun is not installed in this environment; use npm.
- `npm run lint` currently reports pre-existing errors (mostly `@typescript-eslint/no-explicit-any`) in the existing app/edge-function code. These are not caused by environment setup — do not try to "fix" them as part of setup.
- Most routes are behind auth (`ProtectedRoute`) and require a Supabase account. Public routes that need no login: `/auth`, `/register` (multi-step public inscription form), and `/survey/:token`.
- The `/register` confirmation step is currently client-side only (logs to console + shows a confirmation ID); it does not yet persist to Supabase.
- `supabase/` holds migrations + edge functions for the hosted project; running Supabase locally is not required for front-end development.
