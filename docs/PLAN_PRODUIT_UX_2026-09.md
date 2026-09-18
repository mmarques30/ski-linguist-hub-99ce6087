# Plan produit UX — FLI Formation (18/09/2026)

Analyse produit des parcours, menus, fiches et corrélations entre modules.
Base initiale : `main` post-PR usabilité (#48), emails dossier (#55/#58), rôles test (#57).
**Statut feuille de route : Vagues A–D fusionnées dans `main` (PR #60–#65), SHA `d1e8bd9`.**

Ce document **ne remplace pas** `BACKLOG.md` (points bloquants octobre). Il propose l’ordre produit après / en parallèle.

---

## Verdict (après A–D)

Accès client durable (`/suivi/:token`), modes **Assister** stagiaire/formateur, navigation Pilotage/`canView`, et robustesse UX (vides, search, notifs, pont éval) sont **dans le dépôt**.

Reste produit notable (hors backlog octobre) : consolidation Finance 6→3 (PLANO Onda D), taxonomie langues, filtre saison global, journal des envois, fin de « Prévision de Facturation » (BL-032), Documents réels.

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

---

## Suite possible

1. Docs backlog/état (ce refresh) puis déploiement front si BL-046
2. PLANO Onda D : Finance consolidée, taxonomie, saison, journal envois
3. BL octobre restants : OPCO (BL-027), saison comptable (BL-034), compte test (BL-035), pagination (BL-037)…
