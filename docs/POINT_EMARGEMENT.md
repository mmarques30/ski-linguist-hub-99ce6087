# Émargement — fiche produit & schéma

Statut : **décisions validées** (Paula, 2026-10-01) — prêt pour implémentation, pas encore au backlog officiel.  
Objectif : une feuille d’émargement numérique par demi-journée, pour **présentiel** et **visio / individuel en ligne**, source de vérité pour l’attestation et le taux d’assiduité.

Contexte actuel :
- Convocation (`schedule_convocation`) : signature exigée **à chaque demi-journée**.
- CGV / convention : feuille d’émargement validée par la responsable de formation.
- BO : `session_enrollments.attendance_status` (session entière) + `attendance_rate` saisi à la main au pack de fin.
- Pattern réutilisable : QR satisfaction (`SurveyQRCodeDialog`).

---

## 1. Principes

1. **Un seul modèle** pour tous les formats (présentiel station, visio collective, individuel en ligne).
2. **Granularité = créneau** (demi-journée matin / après-midi, ou créneau à la volée pour l’individuel).
3. **Présent = action stagiaire obligatoire** (tap « Je suis présent·e » / signature électronique). Le formateur ne peut pas cocher « présent » à la place du stagiaire.
4. Le formateur gère les **absences / excuses** et **valide** le créneau ; l’admin **contre-signe**.
5. Le taux d’assiduité du pack de fin / attestation se **calcule** depuis les signatures, plus de saisie manuelle.
6. Export PDF **type feuille papier** (grille signatures) pour dossier FIF-PL / Qualiopi.

---

## 2. Décisions validées (Paula)

| # | Question | Décision |
|---|----------|----------|
| 1 | Excuse dans le % d’assiduité | **Excuse = présent** (compte comme présent dans le numérateur) |
| 2 | Individuel en ligne | Créneaux **à la volée** : le formateur « démarre le cours » → 1 créneau |
| 3 | Collectif | Créneaux **au fil de l’eau** (ouvert le jour J / à l’ouverture du créneau), pas de génération massive à la confirmation |
| 4 | Contre-signature admin | **Oui dès le MVP** (`validated_by_admin`) |
| 5 | PDF | **Mise en page type feuille papier** (grille signatures) |
| 6 | Qui pose le « présent » | **Le stagiaire uniquement** — action explicite requise (lien magique / page `/emarger/:token`) |

Formule assiduité (créneaux contre-signés admin) :

```
taux = (present + excuse) / (present + excuse + absent)
```

Les `pending` n’entrent pas dans le calcul. Un créneau non contre-signé n’entre pas non plus.

---

## 3. MVP vs V2

### MVP

| # | Périmètre |
|---|-----------|
| M1 | Tables `attendance_slots` + `attendance_records` + RLS |
| M2 | Ouverture créneau **au fil de l’eau** (collectif : matin/après-midi du jour ; individuel : « Démarrer le cours ») |
| M3 | **Action stagiaire** : page `/emarger/:token` — bouton « Je suis présent·e » (horodatage + identité) |
| M4 | Lien magique court partagé (e-mail / chat Zoom / affiché en salle) — même flux présentiel & distant |
| M5 | Écran formateur : suivi des signatures en direct ; coche **absent / excusé** seulement (pas « présent ») |
| M6 | Validation formateur bloquée tant qu’il reste des `pending` (doit signer, ou être marqué absent/excusé) |
| M7 | **Contre-signature admin** (verrouille définitivement le créneau) |
| M8 | Calcul auto `attendance_rate` ; affichage BO + préremplissage pack de fin (lecture seule) |
| M9 | Export PDF **feuille papier** (colonne signature stagiaire = action + horodatage) |

Hors MVP : QR physique, géoloc, présence Zoom auto, signature manuscrite canvas, relances auto.

Règle dure MVP : `status = present` n’est posé que par l’Edge Function `sign-attendance` (action stagiaire). Ni formateur ni admin ne peuvent forcer un `present` sans cette action (l’admin peut corriger en `absent` / `excuse` uniquement, ou rouvrir le créneau).

### V2

| # | Périmètre |
|---|-----------|
| V1 | QR de séance (réemploi pattern survey) pour présentiel tablette |
| V2 | Fenêtre temporelle stricte (lien / QR valides ±15–30 min autour du créneau) |
| V3 | Relance auto « n’a pas émargé » (cron + notif BO / e-mail) |
| V4 | Signature manuscrite (canvas) si un financeur l’exige encore |
| V5 | Présence indicative Zoom (manuel « tous présents en ligne ») en un clic |

---

## 4. Ancrage métier FLI

| Format | Création du créneau | Action stagiaire (obligatoire pour « présent ») |
|--------|---------------------|--------------------------------------------------|
| Collectif présentiel (station) | Formateur ouvre `matin` ou `apres-midi` du jour | Ouvre le lien / page projetée → « Je suis présent·e » |
| Collectif visio | Idem, au fil de l’eau sur la date de séance | Clique le lien collé dans le chat Zoom |
| Individuel en ligne | Formateur « Démarrer le cours » → 1 créneau `custom` | Clique le lien reçu à l’ouverture |

`session_enrollments.attendance_status` reste un **agrégat dérivé** (ou est déprécié au profit du calcul créneau). Ne pas s’en servir comme source de vérité.

### Cycle de vie d’un créneau

```
draft → open → instructor_validated → admin_validated
                 ↘ closed (annulé / non tenu)
```

- `open` : **seule** la fenêtre où le stagiaire peut poser `present` ; formateur peut poser `absent` / `excuse`.
- `instructor_validated` : aucune ligne `pending` restante ; lignes figées ; admin peut encore corriger (`absent` / `excuse`) puis contre-signer.
- `admin_validated` : définitif ; entre dans le calcul d’assiduité et le PDF « officiel ».

---

## 5. Schéma SQL proposé

```sql
-- Créneau d'émargement (demi-journée ou plage à la volée)
CREATE TABLE public.attendance_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Au moins un des deux : session collective OU inscription individuelle
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  inscription_id uuid REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  -- 'matin' | 'apres-midi' | 'custom'
  day_part text NOT NULL DEFAULT 'custom'
    CHECK (day_part IN ('matin', 'apres-midi', 'custom')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  -- draft | open | instructor_validated | admin_validated | closed
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'open', 'instructor_validated', 'admin_validated', 'closed')),
  opened_at timestamptz,
  closed_at timestamptz,
  instructor_validated_at timestamptz,
  instructor_validated_by uuid REFERENCES auth.users(id),
  admin_validated_at timestamptz,
  admin_validated_by uuid REFERENCES auth.users(id),
  sign_token text UNIQUE,          -- token court pour lien / QR (régénérable)
  sign_token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_slots_owner_check CHECK (
    (session_id IS NOT NULL AND inscription_id IS NULL)
    OR (session_id IS NULL AND inscription_id IS NOT NULL)
  ),
  CONSTRAINT attendance_slots_range_check CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX attendance_slots_session_uniq
  ON public.attendance_slots (session_id, slot_date, day_part)
  WHERE session_id IS NOT NULL AND day_part IN ('matin', 'apres-midi');

CREATE UNIQUE INDEX attendance_slots_inscription_uniq
  ON public.attendance_slots (inscription_id, starts_at)
  WHERE inscription_id IS NOT NULL;

-- Ligne stagiaire × créneau
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES public.attendance_slots(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  inscription_id uuid NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  -- pending | present | absent | excuse
  -- Règle app : present ⇒ signed_via IN ('self_link','qr') et signed_at NOT NULL
  -- (posé uniquement via Edge Function sign-attendance)
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'present', 'absent', 'excuse')),
  -- self_link | qr | instructor | admin
  -- instructor/admin : uniquement pour absent / excuse
  signed_via text
    CHECK (signed_via IS NULL OR signed_via IN ('self_link', 'qr', 'instructor', 'admin')),
  signed_at timestamptz,
  signed_by uuid REFERENCES auth.users(id),
  note text,
  CONSTRAINT attendance_records_present_requires_student_action CHECK (
    status <> 'present'
    OR (signed_via IN ('self_link', 'qr') AND signed_at IS NOT NULL)
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot_id, inscription_id)
);

CREATE INDEX attendance_records_inscription_idx
  ON public.attendance_records (inscription_id);
CREATE INDEX attendance_records_slot_idx
  ON public.attendance_records (slot_id);

-- Taux d'assiduité (créneaux admin_validated uniquement) :
-- (present + excuse) / (present + excuse + absent)
```

### RLS (esquisse)

| Rôle | `attendance_slots` | `attendance_records` |
|------|--------------------|----------------------|
| Staff / admin | CRUD + contre-signature | UPDATE `absent` / `excuse` seulement (pas `present`) |
| Formateur (session / inscription assignée) | SELECT + ouvrir + valider formateur | SELECT + UPDATE `absent` / `excuse` si slot `open` |
| Stagiaire | SELECT de ses créneaux | SELECT siens ; **seul** chemin vers `present` = Edge Function |

**Action stagiaire** : Edge Function `sign-attendance` (token créneau + identité stagiaire). C’est le seul writer autorisé pour `status = present`.

---

## 6. UI cible (MVP)

1. **Portail formateur** — « Ouvrir le créneau » → copie / envoi du lien magique → tableau en direct (en attente / signé / absent / excusé) → « Valider » quand plus aucun `pending`.
2. **Page stagiaire** `/emarger/:token` — **cœur du MVP** : titre session + date + demi-journée, bouton unique « Je suis présent·e », confirmation horodatée. Sans cette action, pas de « présent » sur la feuille.
3. **BO admin** — file « À contre-signer » ; correction `absent` / `excuse` ; contre-signature ; export PDF ; taux sur dossier.
4. **Pack de fin** — assiduité en lecture seule (calculée), override admin exceptionnel avec motif.
5. **PDF** — en-tête organisme / session / date / demi-journée ; grille nominative ; colonne signature = « Signé électroniquement le … » (preuves d’action stagiaire) ou « Absent / Excusé » ; zones formateur + responsable de formation.

---

## 7. Hors scope

- Modification de `docs/BACKLOG.md` / `ETAT_APP_*` (commit dédié sur `main` après merge).
- Intégration Zoom API, géolocalisation, biométrie.
- Remplacement rétroactif des feuilles papier déjà signées cette saison.
