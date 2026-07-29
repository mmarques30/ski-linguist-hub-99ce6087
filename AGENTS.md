# AGENTS.md

## Cursor Cloud specific instructions

This is a single-package **Vite + React 18 + TypeScript** SPA (Lovable-generated) named
"FLI Formation" — a training-center/back-office management platform. The backend is a
**hosted (remote) Supabase** project, not a local one.

### Services
- **Frontend (Vite dev server)** — the only service in this repo. Runs on port **8080**
  (`vite.config.ts`, host `::`). Start with `npm run dev`.
- **Supabase backend** — hosted at the URL in `.env` (`VITE_SUPABASE_URL`). The frontend is
  already wired to it via the committed anon key in `.env`, so no local Supabase stack is
  needed to run the app. Edge functions in `supabase/functions/` are deployed to Supabase
  cloud (running them locally requires the Supabase CLI + Deno and is optional).

### Standard commands (see `package.json`)
- Install: `npm i` (npm is the package manager used here; `package-lock.json` is committed).
- Dev server: `npm run dev` (http://localhost:8080).
- Build: `npm run build` (prod) or `npm run build:dev`.
- Lint: `npm run lint` (ESLint 9 flat config, `eslint.config.js`).

### Non-obvious caveats
- **No automated test runner** is configured (no Vitest/Jest/Playwright). Testing is manual;
  see `docs/TESTING_GUIDE.md` and the in-app checklist at route `/admin/testing`.
- `npm run lint` currently reports pre-existing errors in the app code (mostly
  `@typescript-eslint/no-explicit-any`). These are repo issues, not environment problems.
- **Signups are disabled** on the hosted Supabase instance, so you cannot self-register an
  admin/staff account. Admin login (all `/`, `/finance/*`, `/students`, etc. routes are
  behind `ProtectedRoute`) requires **pre-existing credentials**; new users are provisioned
  only via the `create-user` edge function (needs the service-role key). The **public
  registration form at `/register`** and the student portal login are reachable without
  admin credentials. Note the `/register` confirmation step is currently client-only (it
  does not persist to the DB).
- Don't run `npm run lint` and `npm run build` at the same time: the Vite build writes a
  transient `vite.config.ts.timestamp-*.mjs` file that ESLint may try to read and then fail
  with an `ENOENT` on that temp file. Run them separately.
- Bun lockfiles (`bun.lock`, `bun.lockb`) are also committed, but this environment uses npm.
