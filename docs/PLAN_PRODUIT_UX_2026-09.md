# Plan produit UX — FLI Formation (18/09/2026)

Analyse produit des parcours, menus, fiches et corrélations entre modules.
Base initiale : `main` post-PR usabilité (#48), emails dossier (#55/#58), rôles test (#57).
**Statut feuille de route : Vagues A–D + PLANO Onda D (D1–D8) fusionnés dans `main` (PR #60–#65, #67/#68, #70), SHA `fb6ed5f`.**

Ce document **ne remplace pas** `BACKLOG.md` (points bloquants octobre). Il propose l’ordre produit après / en parallèle.

---

## Verdict (après A–D + Onda D)

Accès client durable (`/suivi/:token`), modes **Assister** stagiaire/formateur, navigation Pilotage/`canView`, robustesse UX, et consolidation Onda D (finance, langues, saison, journal envois) sont **dans le dépôt**.

Reste produit notable (hors backlog octobre) : Documents réels (C5). BL-032 et Onda D5–D8 sont fusionnés (PR #71, #70). BL octobre restants : OPCO (BL-027), saison comptable (BL-034), compte test (BL-035), partenaires (BL-038), vigilance formateur (BL-042).

---

## Vos trois douleurs — statut

### 1. Lien client introuvable après génération — **traité (Vague A)**

| Mécanisme | Retrappable par l’admin ? |
|---|---|
| Code d’inscription | Oui (Accès client, copiable) |
| `/register` générique | Oui, mais **pas client-spécifique** |
| URL Stripe Checkout | Non (éphémère) |
| Magic link portail | Invite via `app_settings.student_portal_enabled` + journal fiche |
| URL de suivi par inscription | **Oui** — `/suivi/:token` (PR #60) |

### 2. Admin ne voit pas l’espace client / formateur — **traité (Vague A)**

- Assister stagiaire : `/portails/stagiaire/:id/*` (vrais composants `/student/*`)
- Assister formateur : `/portails/formateur/:id/*` (vrais `/formateur/*`)
- Preview maquette remplacé / redirigé

### 3. Menus à réorganiser — **partiel (Vague C)**

Sidebar 2 niveaux + Pilotage + Trésorerie + Portails + `canView`. Documents/Sessions hors menu principal. Reste éventuel : badge « gelé » Moniteurs, glossaire KPI Finance.

---

## Feuille de route

### Vague A — Accès & assistance (P0) — **fait** (PR #60, #61)

1. Lien de suivi `/suivi/:token`
2. Mode Assister stagiaire (vrais composants)
3. Mode Assister formateur
4. Invitation portail via `app_settings` + journal fiche ; `/tests` en pistes

### Vague B — Boucle opérationnelle (P1) — **fait** (PR #63)

1. Checklist fiche inscription (horaire · docs · paiement · facture · portail · enquête)
2. Paiements + relances sous onglet Financier
3. Dashboard « À traiter » cliquable
4. `/student/test` : page honnête (plus de CTA mort)

### Vague C — Navigation (P2) — **fait** (PR #64)

1. Sidebar proposée (Portails, Trésorerie)
2. Fusion Finance analytique → Pilotage
3. `canView` dans `ProtectedRoute`

### Vague D — Robustesse UX (P3) — **fait** (PR #65)

États vides honnêtes, recherche globale enrichie, notifications multi-types (`/notifications`), pont évaluation ↔ inscription / stagiaire.

### PLANO Onda D — Consolidation (D1–D4) — **fait** (PR #67, hotfix #68)

1. Finance : glossaire KPI, dépenses réelles, objectifs `revenue_target` (BL-039), anti double comptage trésorerie
2. Taxonomie langues unique (`language-catalog`)
3. Filtre saison global (`SeasonContext` + bornes dates ; défaut « toutes »)
4. Journal des envois (`email_log` sur `/admin/emails`)

---

### PLANO Onda D — Suite (D5–D8) — **fait** (PR #70)

1. Identité org consommée par factures, emails et logo (`OrganizationIdentityCard`)
2. Chrome i18n FR (sidebar, header, breadcrumbs)
3. Import upsert idempotent, export avant purge, erreurs à l’écran
4. CRM leads : `loss_reason`, `assigned_to`, conversion enrichie

---

## Suite possible

1. Déploiement front si BL-046
2. BL octobre restants : OPCO (BL-027), saison comptable (BL-034), compte test (BL-035), partenaires (BL-038), vigilance formateur (BL-042)
3. Documents réels (C5) et planning unifié (C3)
