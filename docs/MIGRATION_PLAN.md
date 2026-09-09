# Plan de migration des données — FLI Ski Linguist Hub

**Date de cutover (import final) : 30 septembre 2026**

Ce document décrit comment passer du fonctionnement actuel (Excel + imports partiels + nouveau `/register`) à un système pleinement opérationnel **sans ressaisir l’historique**.

---

## Principe

| Période | Règle |
|---------|--------|
| **Avant le 30/09/2026** | L’entreprise continue normalement. Nouvelles inscriptions via `/register` ou admin. Données hors système notées dans un fichier « delta ». |
| **Le 30/09/2026** | Import final (delta) + validation. Pas de re-saisie des ~905 inscriptions déjà en base. |
| **Après le 30/09/2026** | 100 % des processus dans le système. |

---

## État actuel de la base (référence)

| Table | Volume approx. |
|-------|----------------|
| `students` | 630 |
| `inscriptions` | 905 |
| `placement_tests` | 595 |
| `ski_monitors` | 4 047 |
| `partners` | 1 032 |
| `invoices` | 0 (à importer le 30/09) |
| `payments` | 1 |

---

## Calendrier

### Phase 1 — Maintenant → 29/09/2026 (Onda A en cours)

- [x] Tab **Accès client** sur chaque inscription (liens, emails, survey, preview portal)
- [x] Tab **Documents** connectée à `document_sendings`
- [x] **Voir comme le stagiaire** (`/students/:id/portal-preview`)
- [ ] Stripe webhook configuré (paiements nouveaux)
- [ ] Fichier Excel « delta » tenu à jour (inscriptions/factures hors système)

### Phase 2 — Semaine du 22/09/2026 (préparation)

1. Export final depuis les sources externes (Excel, compta, etc.)
2. Exécuter scripts de réconciliation (doublons email, codes FLI)
3. Préparer CSV pour `/admin/import` :
   - `invoices` (historique)
   - `payments` (si applicable)
   - delta `inscriptions` / `students` (uniquement nouvelles depuis dernier import)

### Phase 3 — 30/09/2026 (jour J)

| Heure | Action |
|-------|--------|
| Matin | Gel des imports manuels Excel (source de vérité = système) |
| 09h00 | Import delta via `/admin/import` ou SQL contrôlé |
| 10h00 | Validation : comptages, échantillon 20 fiches inscription |
| 11h00 | Vérification tab **Accès client** sur inscriptions actives |
| 14h00 | Équipe formée sur nouveau flux (register, documents, preview portal) |
| 16h00 | Go-live facturation dans le système (si pas déjà fait) |

### Phase 4 — Octobre 2026 (Onda B)

- Convites portail stagiaire en masse (après import)
- Timeline inscription
- Vue J-10 horaires en lot

---

## Fichier « delta » (à maintenir jusqu’au 30/09)

Colonnes minimales :

| Colonne | Description |
|---------|-------------|
| `email` | Email stagiaire |
| `code_fli` | Code inscription si connu |
| `source` | excel / telephone / register / autre |
| `date_saisie` | Date de l’événement |
| `importe_systeme` | OUI / NON |
| `notes` | Libre |

**Règle :** chaque ligne avec `importe_systeme = NON` sera traitée le 30/09.

---

## Imports techniques

### Via l’admin (`/admin/import`)

Tables supportées : `students`, `inscriptions`, `invoices`, `instructors`, `ski_schools`

### Via SQL (one-off, 30/09)

Exemple de contrôle avant import :

```sql
-- Inscriptions sans stagiaire lié
SELECT i.code, i.id FROM inscriptions i
LEFT JOIN students s ON s.id = i.student_id
WHERE s.id IS NULL
LIMIT 20;

-- Doublons email stagiaires
SELECT email, COUNT(*) FROM students
WHERE email IS NOT NULL
GROUP BY email HAVING COUNT(*) > 1;
```

### Ce qu’on ne réimporte pas

- `ski_monitors` (4 047 — déjà en base)
- `partners` (1 032 — déjà en base)
- `placement_tests` liés aux inscriptions existantes

---

## Checklist validation (30/09)

- [ ] Nombre stagiaires cohérent (630 + delta)
- [ ] Nombre inscriptions cohérent (905 + delta)
- [ ] Tab Accès client affiche liens sur 5 inscriptions test
- [ ] Preview portal fonctionne pour 3 stagiaires
- [ ] Factures historiques importées (si applicable)
- [ ] Aucune inscription active uniquement dans Excel

---

## Contacts & responsabilités

| Rôle | Responsabilité |
|------|----------------|
| Paula | Validation métier, horaires J-10, go-live |
| Technique | Imports SQL/CSV, Stripe, edge functions |
| Équipe FLI | Saisie uniquement dans le système après le 30/09 |

---

## Références

- Import admin : `/admin/import`
- Guide Stripe : `docs/STRIPE_SETUP.md`
- Tests placement : `/tests`
- Inscription publique : `/register`
