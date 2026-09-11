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
- Install: `npm install --legacy-peer-deps` (use this flag; plain `npm i` / `npm ci` can fail with
  Arborist `edgesOut` / incomplete optional bindings in the committed lockfile).
- Dev server: `npm run dev` (http://localhost:8080).
- Build: `npm run build` (prod) or `npm run build:dev`.
- Unit tests: `npm test` (Vitest).
- Lint: `npm run lint` (ESLint 9 flat config, `eslint.config.js`).

### Non-obvious caveats
- Manual product testing: see `docs/TESTING_GUIDE.md` and the in-app checklist at `/admin/testing`.
- `npm run lint` currently reports pre-existing errors in the app code (mostly
  `@typescript-eslint/no-explicit-any`). These are repo issues, not environment problems.
- **Signups are disabled** on the hosted Supabase instance, so you cannot self-register an
  admin/staff account. Admin login (all `/`, `/finance/*`, `/students`, etc. routes are
  behind `ProtectedRoute`) requires **pre-existing credentials**; new users are provisioned
  only via the `create-user` edge function (needs the service-role key). The **public
  registration form at `/register`** and the student portal login are reachable without
  admin credentials. Note the `/register` confirmation step is currently client-only (it
  does not persist to the DB).
- The **student portal login** at `/auth?mode=student` offers **magic link only** — there is
  no password field (`StudentAuthCard`). To sign a student account in with a password, use the
  admin card at `/auth`: `Auth.tsx` reads the role afterwards and redirects any `student`
  to `/student/dashboard`.
- Creating synthetic **test accounts** directly in `auth.users` has two undocumented
  prerequisites, or sign-in fails with `Database error querying schema` (or HTTP 500):
  a matching `auth.identities` row is mandatory, and the token columns
  (`confirmation_token`, `recovery_token`, `email_change*`, `phone_change*`,
  `reauthentication_token`) must be **empty strings, not `NULL`**. Hash passwords with
  `crypt(…, gen_salt('bf'))` (pgcrypto is installed).
- Deleting from `storage.objects` in SQL is blocked by the `storage.protect_delete()` trigger.
  Use the Storage HTTP API, or wrap the delete in `set local session_replication_role = replica;`
  then restore `origin`.
- Don't run `npm run lint` and `npm run build` at the same time: the Vite build writes a
  transient `vite.config.ts.timestamp-*.mjs` file that ESLint may try to read and then fail
  with an `ENOENT` on that temp file. Run them separately.
- Bun lockfiles (`bun.lock`, `bun.lockb`) are also committed, but this environment uses npm.

### Git / docs (Paula, 2026-09-11)
- Do **not** modify `docs/BACKLOG.md` or `docs/ETAT_APP_*.md` on working branches.
  Those files are updated in a **separate commit on `main`** after each point is
  merged (or on a dedicated `docs/` branch that Paula merges last).
- Before every delivery report (and before saying a PR is ready to merge),
  **merge `origin/main` into the working branch**, resolve any leftover conflicts,
  and push, so Paula never has to resolve a merge conflict herself.

