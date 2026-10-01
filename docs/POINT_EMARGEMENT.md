# Émargement — fiche produit & schéma (proposition)

Statut : **proposition** (pas encore au backlog officiel ni implémenté).  
Objectif : une feuille d’émargement numérique par demi-journée, pour **présentiel** et **visio / individuel en ligne**, source de vérité pour l’attestation et le taux d’assiduité.

Contexte actuel :
- Convocation (`schedule_convocation`) : signature exigée **à chaque demi-journée**.
- CGV / convention : feuille d’émargement validée par la responsable de formation.
- BO : `session_enrollments.attendance_status` (session entière) + `attendance_rate` saisi à la main au pack de fin.
- Pattern réutilisable : QR satisfaction (`SurveyQRCodeDialog`).

---

## 1. Principes

1. **Un seul modèle** pour tous les formats (présentiel station, visio collective, individuel en ligne).
2. **Granularité = créneau** (demi-journée matin / après-midi, ou créneau horaire pour l’individuel).
3. Le stagiaire **signe** (ou le formateur coche) ; le formateur **valide** le créneau.
4. Le taux d’assiduité du pack de fin / attestation se **calcule** depuis les signatures, plus de saisie manuelle.
5. Export PDF feuille d’émargement (horodatages + canal) pour dossier FIF-PL / Qualiopi.

---

## 2. MVP vs V2

### MVP (livrable utile dès la saison)

| # | Périmètre |
|---|-----------|
| M1 | Tables `attendance_slots` + `attendance_records` + RLS |
| M2 | Génération des créneaux à partir du planning (session collective ou dates d’inscription individuelle) |
| M3 | Écran formateur « Émarger ce créneau » : liste stagiaires, coche présent / absent / excusé |
| M4 | Signature stagiaire via **lien magique** court (e-mail / chat) — même flux présentiel & distant |
| M5 | Validation formateur du créneau (verrouille les lignes) |
| M6 | Calcul auto `attendance_rate` ; affichage BO + préremplissage pack de fin |
| M7 | Export PDF feuille d’émargement (une page par créneau ou récap session) |

Hors MVP volontairement : QR physique, géoloc, présence Zoom auto, signature manuscrite canvas.

### V2

| # | Périmètre |
|---|-----------|
| V1 | QR de séance (réemploi pattern survey) pour présentiel tablette |
| V2 | Fenêtre temporelle stricte (lien / QR valides ±15–30 min autour du créneau) |
| V3 | Relance auto « n’a pas émargé » (cron + notif BO / e-mail) |
| V4 | Contre-signature responsable de formation (statut `validated_by_admin`) |
| V5 | Signature manuscrite (canvas) si un financeur l’exige encore |
| V6 | Présence indicative Zoom (manuel « tous présents en ligne ») en un clic |

---

## 3. Ancrage métier FLI

| Format | Source des créneaux | Canal MVP |
|--------|---------------------|-----------|
| Collectif présentiel (station) | Dates session × `matin` / `apres-midi` (`SCHEDULE_SLOTS`, plages `FLI_SCHEDULE_HOURS`) | Lien magique + coche formateur |
| Collectif visio | Liste des dates de séance × demi-journée | Lien magique (chat Zoom) |
| Individuel en ligne | Pack d’heures planifiées sur l’inscription (`schedule` / dates séances) | Lien magique à l’ouverture |

`session_enrollments.attendance_status` reste un **agrégat dérivé** (ou est déprécié au profit du calcul créneau). Ne pas s’en servir comme source de vérité.

---

## 4. Schéma SQL proposé

```sql
-- Créneau d'émargement (demi-journée ou plage horaire)
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
  -- open | closed | validated
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'validated')),
  opened_at timestamptz,
  closed_at timestamptz,
  validated_at timestamptz,
  validated_by uuid REFERENCES auth.users(id),
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
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'present', 'absent', 'excuse')),
  -- self_link | qr | instructor | admin
  signed_via text
    CHECK (signed_via IS NULL OR signed_via IN ('self_link', 'qr', 'instructor', 'admin')),
  signed_at timestamptz,
  signed_by uuid REFERENCES auth.users(id),  -- user qui a posé le statut
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot_id, inscription_id)
);

CREATE INDEX attendance_records_inscription_idx
  ON public.attendance_records (inscription_id);
CREATE INDEX attendance_records_slot_idx
  ON public.attendance_records (slot_id);

-- Vue / fonction : taux d'assiduité
-- present / (present + absent + excuse) sur créneaux validated
-- (pending ignorés ; excuse compte comme non-présent pour le % FIF-PL — à confirmer Paula)
```

### RLS (esquisse)

| Rôle | `attendance_slots` | `attendance_records` |
|------|--------------------|----------------------|
| Staff / admin | CRUD | CRUD |
| Formateur (session / inscription assignée) | SELECT + ouvrir/valider | SELECT + UPDATE statut si slot `open` |
| Stagiaire | SELECT de ses créneaux | SELECT siens ; UPDATE `present` via Edge Function token (pas de write direct anon) |

Signature self-service : Edge Function `sign-attendance` (token créneau + identité stagiaire / magic link), pour ne pas exposer le write RLS large.

---

## 5. UI cible (MVP)

1. **Portail formateur** — sur une session / inscription en cours : onglet Émargement → créneaux du jour → « Ouvrir » → liste → coche / attendre signatures → « Valider le créneau ».
2. **Page publique** `/emarger/:token` — nom du créneau, bouton « Je suis présent·e » (auth stagiaire ou token inscription).
3. **BO admin** — lecture seule + correction ; export PDF ; taux affiché sur dossier.
4. **Pack de fin** — champ assiduité en lecture seule (calculé), override admin exceptionnel avec motif.

---

## 6. Décisions à trancher avant code

1. **Excuse** : compte-t-elle dans le dénominateur du % d’assiduité ? (proposition : oui, comme non-présent).
2. **Individuel en ligne** : créneaux créés à la planification des heures, ou à la volée par le formateur (« démarrer le cours » → 1 créneau) ?
3. **Collectif** : générer tous les créneaux à la confirmation de session, ou la veille / au matin J ?
4. Faut-il la **contre-signature admin** dès le MVP, ou seulement V2 ?
5. Le PDF doit-il reprendre la mise en page « feuille papier » (grille signatures) ou un récap moderne horodaté suffit pour FIF-PL ?

---

## 7. Hors scope

- Modification de `docs/BACKLOG.md` / `ETAT_APP_*` (commit dédié sur `main` après validation Paula).
- Intégration Zoom API, géolocalisation, biométrie.
- Remplacement rétroactif des feuilles papier déjà signées cette saison.
