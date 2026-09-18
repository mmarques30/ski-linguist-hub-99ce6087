# Plan produit UX — FLI Formation (18/09/2026)

Analyse produit des parcours, menus, fiches et corrélations entre modules.
Base : `main` post-PR usabilité (#48), emails dossier (#55/#58), rôles test (#57).
Rapport HTML illustré : livré en artefact agent (`plan-produit-ux-fli-2026-09-18.html`).

Ce document **ne remplace pas** `BACKLOG.md` (points bloquants octobre). Il propose l’ordre produit après / en parallèle.

---

## Verdict

Le système a **gagné en connexions entre fiches** (inscription ↔ stagiaire ↔ facture ↔ paiement ↔ partenaire) mais reste **faible sur l’accès client durable**, sur le **« voir comme » réel** (élève / formateur), et sur une **navigation encore trop large** (Finance ×7, Administration fourre-tout).

---

## Vos trois douleurs — diagnostic

### 1. Lien client introuvable après génération

| Mécanisme | Retrappable par l’admin ? |
|---|---|
| Code d’inscription | Oui (Accès client, copiable) |
| `/register` générique | Oui, mais **pas client-spécifique** |
| URL Stripe Checkout | Non (éphémère) |
| Magic link portail | Non (email seul ; invite gelée) |
| URL de suivi par inscription | **N’existe pas** |

**Cible :** page publique `/suivi/:token` liée à l’inscription, visible Accès client + email confirmation + liste.

### 2. Admin ne voit pas l’espace client / formateur

- `/students/:id/portal-preview` = **maquette séparée** (pas `StudentLayout` / `/student/*`).
- « Portail (compte lié) » échoue pour un admin (`StudentProtectedRoute`).
- Aucun « voir comme formateur ».

**Cible :** mode **Assister** qui réutilise les vrais composants `/student/*` et `/formateur/*`, bandeau ambre, lecture seule.

### 3. Menus à réorganiser

Sidebar 2 niveaux OK. Prochaine étape : réduire Finance (→ Factures · Paiements · Pilotage), séparer **Formateurs (équipe CRM)** vs **Évaluations orales**, regrouper Réglages, cacher Documents/Sessions fantômes, badge « gelé » sur Moniteurs.

---

## Feuille de route

### Vague A — Accès & assistance (P0)

1. Lien de suivi `/suivi/:token`
2. Mode Assister stagiaire (vrais composants)
3. Mode Assister formateur
4. Invitation portail via `app_settings` (plus de hardcode) + journal fiche

### Vague B — Boucle opérationnelle (P1)

1. Checklist fiche inscription (horaire · docs · paiement · facture · portail · enquête)
2. Paiements + relances sous onglet Financier
3. Dashboard « À traiter » cliquable
4. `/student/test` : CTA réel ou masquer

### Vague C — Navigation (P2)

1. Appliquer la sidebar proposée
2. Fusion Finance analytique → Pilotage
3. `canView` dans `ProtectedRoute` (permissions = sécurité)

### Vague D — Robustesse UX (P3)

États vides honnêtes, recherche globale enrichie, notifications multi-types, pont évaluation ↔ inscription.

---

## Recommandation

Attaquer **Vague A** en premier : sans lien de suivi et sans Assister, le support client reste à l’aveugle.

**À trancher :** (1) `/suivi/:token`, (2) Assister stagiaire, ou (3) refonte menu Finance / Opérations ?
