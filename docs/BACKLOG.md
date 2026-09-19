# Backlog FLI — hors point en cours

Règle : noter ici, **ne pas corriger** tant que le point courant n’est pas validé.

Dernière mise à jour : 2026-09-19 (BL-038 hard dedup PR #80 ; Vague 0 + lots #74–#78).

## Conventions de lecture

- **Gravité** reprise telle qu’elle est qualifiée dans le journal : `bloquant`, `gênant`, `cosmétique`.
  Les deux gravités proposées par la testeuse et non tranchées sont marquées « proposé ».
- **État** :
  - `ouvert` — rien de fait dans le dépôt ;
  - `dépôt OK / à déployer` — corrigé sur `main`, jamais visible sur l’app publiée ;
  - `branche PR #n` — corrigé, en attente de fusion ;
  - `clos` — corrigé **et** vérifié (référence à l’appui).
- Les constats vérifiés en base le 15/09 portent la mention *(live)* avec le chiffre observé.

---

## Ordre de traitement proposé pour le 1er octobre

L’ordre suit la demande : d’abord `/register`, la connexion, le tableau de bord et les
données ; ensuite le reste. Une vague n’est « finie » que déployée, le journal ayant montré
quatre fois de suite qu’un correctif fusionné mais non publié ne compte pas.

### Vague 0 — déployer ce qui est déjà écrit (aucun développement)

| Ordre | Sujet | ID |
|-------|-------|----|
| 0.1 | Publier le front (retard depuis `cab5b71` du 11/09) : invitations en masse, adresses placeholder, checklist et `/auth` en français, réglage de statut, « Pack de fin de formation » | BL-046 |
| 0.2 | Déployer les fonctions Edge + poser `RESEND_API_KEY` : `submit-registration`, `send-test-email`, `invite-student-portal`, `cleanup-zztest` | BL-047 |

**0.1 et 0.2 clos** (19/09/2026) — front publié (`plateforme.fli.fr`, deploy `254b23f3`, SHA `a24ccea` + suites) ; 19 edges republishées ; `RESEND_API_KEY` présente ; Stripe check OK (webhook via `app_settings`).

### Vague 1 — `/register` et connexion

| Ordre | Sujet | Gravité | ID |
|-------|-------|---------|----|
| 1.1 | Lien vers les conditions générales avant la case à cocher | bloquant | BL-023 |
| 1.2 | Aucun moyen de paiement coché par défaut (décision Paula) | gênant | BL-024 |
| 1.3 | « FIFPL » et « OPCO » séparés (règle OPCO attendue de Paula) | gênant | BL-027 |
| 1.4 | Message du test réservé aux groupes en station, signé « l’équipe FLI » | gênant | BL-028 |
| 1.5 | Piste affichée « Piste verte » quand la verte n’est pas validée | gênant | BL-026 |
| 1.6 | Message d’échec en français, saisie conservée, consigne de contact | gênant | BL-025 |
| 1.7 | Dates flexibles : ne plus hériter des dates de saison | gênant | BL-029 |

1.3 : choix FIFPL / OPCO **séparés** (PR #76) ; **règle de paiement OPCO** toujours attendue de Paula. 1.1–1.2 et 1.4–1.7 **fusionnés** (PR #44 / #45). `/auth` FR **déployé** (Vague 0).

### Vague 2 — tableau de bord et données

| Ordre | Sujet | Gravité | ID |
|-------|-------|---------|----|
| 2.1 | Accents perdus (Mac Roman) sur un lot d’import — **avant toute génération de document nominatif** | gênant, bloquant si documents générés | BL-033 |
| 2.2 | Saison sur l’exercice comptable 01/07 → 30/06 (décision Paula) | gênant | BL-034 |
| 2.3 | Supprimer le compte « Utilisateur Test » (décision Paula) | gênant | BL-035 |
| 2.4 | `/settings` : rendre l’identité de l’organisation enregistrable — aujourd’hui le formulaire n’écrit rien et annonce un succès | bloquant (proposé) | BL-036 |
| 2.5 | Accueil : retirer les KPI de prévision, contraires à `SPEC_UI` | gênant | BL-032 |
| 2.6 | Niveaux de test importés : réponses libres dans `determined_level` | gênant | BL-002 |
| 2.7 | Compteurs plafonnés à 1 000 et listes sans pagination | gênant | BL-037 |
| 2.8 | `/finance` : objectifs de trimestre codés en dur | gênant | BL-039 |

2.1 **clos** (PR #42). 2.2 **clos** (suite3 — migration saison exercice). 2.4 **clos** (PR #44). 2.5 **clos** (PR #71). 2.6 **clos** (PR #30/#43). 2.7 **clos** (PR #71). 2.8 **clos** (Onda D PR #67/#68).
2.3 (BL-035) **clos** — compte `teste@fli.fr` supprimé (live, suite4).

### Vague 3 — reste bloquant et gênant

| Ordre | Sujet | Gravité | ID |
|-------|-------|---------|----|
| 3.1 | Périmètre du nettoyage : inclure `test_phrases` | gênant | BL-044 |
| 3.2 | `/students` : recherche « prénom nom » | gênant | BL-040 |
| 3.3 | `/students` : marquer « email manquant » sur les 35 adresses placeholder | gênant | BL-045 |
| 3.4 | `/gestion/partenaires` : dédoublonner et normaliser | gênant | BL-038 |
| 3.5 | Fiche formateur·rice : Planning et Historique depuis les inscriptions | gênant | BL-041 |
| 3.6 | Fiche formateur·rice : bloc contrat / vigilance / statut administratif | gênant | BL-042 |
| 3.7 | Fiche inscription : rafraîchir après affectation (à revérifier une fois déployé) | gênant | BL-043 |

3.1–3.7 **fusionnés** (PR #71–#74 + #76 soft + #80 hard dedup). Vague 3 close pour le 1er octobre.

### Vague 4 — cosmétique, si le temps le permet

BL-030 / BL-050 **fusionnés** (PR #73 + #75). Reste éventuel : peaufinage BL-014, cosmétique hors recette.

### Hors périmètre du 1er octobre

BL-001, BL-007, BL-008, BL-009, BL-010, BL-011, BL-014, BL-015, BL-017, BL-019, BL-020,
BL-022 : dette antérieure, non remontée par la recette.

---

## Ouvert

### Issu de la recette des 11 → 15/09

| ID | Écran / chemin | Constat | Gravité | État |
|----|----------------|---------|---------|------|
| BL-023 | `/register` étape 7 | La case « J’accepte les conditions générales » ne donne accès à aucun texte. Attendu : un lien vers les conditions générales de formation, ouvert dans un nouvel onglet, placé avant la case | bloquant | **clos** — PR #44 ; page `/conditions-generales` |
| BL-024 | `/register` étape 6 | « 150 € en ligne (Stripe) + solde par chèque » est présélectionné alors que Stripe n’est pas validé (point 6). **Décision Paula : aucun moyen coché par défaut tant que le point 6 n’est pas validé.** À passer bloquant si Stripe n’est pas opérationnel au 1er octobre | gênant | **clos** — PR #44 |
| BL-025 | `/register` étape 7 | En cas d’échec, le message brut de la fonction Edge est affiché tel quel, en anglais et sans consigne. Attendu : message en français, vouvoiement, saisie conservée, consigne (réessayer, `info@fli.fr`, 04 79 28 21 09) | gênant | **clos** — PR #44 |
| BL-026 | `/register` (résultat du test, récapitulatif) et espace stagiaire | Un·e stagiaire qui ne valide pas la piste verte lit « Piste atteinte : Vocabulaire ski » ou « Début de parcours ». Attendu : « Piste verte », même règle sur tous les écrans stagiaire | gênant | **clos** — PR #44 |
| BL-027 | `/register` étapes 1 et 6 | « OPCO / FIFPL » était un choix unique (règle FIFPL). **Décision Paula : deux choix distincts ; règle OPCO à venir** | gênant | **partiel** — choix séparés + FIFPL 150 € + OPCO sans frais auto (PR #76) ; **règle paiement OPCO** attend Paula |
| BL-028 | `/register`, test de niveau | Le message sur l’attribution du groupe matin / après-midi s’affiche quelle que soit la modalité et nomme la directrice par son prénom. **Décision Paula : réservé aux groupes en station, signé « l’équipe FLI »** | gênant | **clos** — PR #44 |
| BL-029 | `/register`, dates flexibles | `submit-registration` retombe sur les dates de la saison : une inscription sans dates hérite de dates fausses, ce qui fausse aussi le J-10. Attendu : exiger une date ou laisser « à planifier » | gênant | **clos** — PR #45 |
| BL-030 | `/register`, libellés | En-tête « pour moniteurs de ski » y compris pour « Autre profession », pas de point médian, bouton « Continuer vers la configuration de la formation » qui mène au test, « Piste verte: 3/5 », score affiché « 8/20 » puis « 3 bonnes réponses ». En-tête à valider par la direction | cosmétique | **clos** — PR #73 (bouton, middot, score) + suite4 (en-tête selon profession) |
| BL-031 | `/auth` | Page de connexion lue en portugais (« Painel Administrativo », « Senha », « Entrar ») | gênant | **clos** — dépôt FR + déployé Vague 0 (19/09) |
| BL-032 | `/` (accueil) | KPI « Prévision Mensuelle » et « Prévision de Facturation » contraires à `SPEC_UI`. Les intitulés portugais relevés venaient du front publié : la langue par défaut est `fr` dans le dépôt | gênant | **clos** — PR #71 ; retrait onglet / carte « Prévision de Facturation » (`DashboardGestao.tsx`) |
| BL-033 | Données (lot d’import) | Accents perdus en Mac Roman : les octets `0x8D` / `0x8E` / `0x8F` sont restés tels quels au lieu de `ç` / `é` / `è`. *(live)* `inscriptions` 679 lignes sur 886, `students` 186 sur 664, `partners` 20 sur 1033, `ski_monitors` 1 sur 4047. Colonnes : `inscriptions.code` 577, `language` 261 (« Portugais brsilien » 216, « Nerlandais » 43), `course_address` 233, `course_location` 202, `expectations` 194, `rhythm` 124, `students.street_address` 85, `city` 56, `first_name` 45, `last_name` 33. `invoices` et `payments` (import du point 9) sont propres | gênant, **bloquant si des documents nominatifs sont générés** | **clos** — PR #42 ; `docs/POINT_BL033_ACCENTS.md` |
| BL-034 | `/admin/seasons` | *(live)* la saison courante « Saison 2026-2027 » va du 01/12/2026 au 31/03/2027. **Décision Paula : saison = exercice comptable, 01/07 → 30/06.** Le statut `en_cours` est déjà traduit dans le dépôt | gênant | **clos** — migration `20260919120000_bl034_…` + défauts `SeasonFormDialog` (PR suite3) |
| BL-035 | `/admin/users` | *(live)* le compte « Utilisateur Test » (`teste@fli.fr`) a les droits admin, donc l’accès à toutes les données personnelles. **Décision Paula : suppression** | gênant | **clos** — compte supprimé en live (suite4) |
| BL-036 | `/settings` | L’identité de l’organisation est vide, et le bouton « Enregistrer les modifications » n’écrit rien : `handleSave` se limite à un `console.log` puis affiche « Modifications enregistrées ». **Paula veut la remplir elle-même : c’est aujourd’hui impossible, et le succès affiché est trompeur** | bloquant (proposé, écart nouveau) | **clos** — PR #44 ; `OrganizationIdentityCard` → `app_settings.fli_identity` |
| BL-037 | `/gestion/moniteurs`, `/gestion/partenaires` | Les compteurs affichent 1 000 parce que la requête lit des lignes au lieu de demander un comptage, et les listes sont plafonnées à 1 000. *(live)* 4 047 moniteurs, 1 033 partenaires. Attendu : comptage serveur et pagination | gênant | **clos** — PR #71 ; `count: "exact"` + `.range()` (`useSkiMonitors`, `usePartners`) |
| BL-038 | `/gestion/partenaires` | *(live)* 23 fiches nommées par une adresse email, 4 fiches « À l’attention de… », doublons entre une fiche « directeur / prospect » et la fiche « ESF … / actif » de la même école, 20 fiches à accents cassés (voir BL-033) | gênant | **clos** — signaux soft PR #76 ; hard dedup / fusion PR #80 (`partner-dedup`, filtre Doublons, `app_settings.partner_dedup_map` sous gel) |
| BL-039 | `/finance` | Objectifs de trimestre codés en dur (50 000 € de CA, 15 stagiaires, 60 %), jamais fournis par la direction. Attendu : les retirer, ou les rendre paramétrables et vides par défaut | gênant | **clos** — PR #67/#68 : lecture `seasons.revenue_target` ; `≤ 0` / vide → « Aucun objectif » |
| BL-040 | `/students` | La recherche ne combine pas prénom et nom : « Prénom Nom » ne renvoie rien, « ZZTEST » seul fonctionne. Attendu : rechercher sur la concaténation | gênant | **clos** — PR #71 ; `buildStudentSearchFilter` (`useStudents.ts`) |
| BL-041 | `/formateurs`, fiche | Planning et Historique lisent `instructor_sessions` — *(live)* 0 ligne — au lieu des inscriptions rattachées : aucune activité n’apparaît | gênant | **clos** — PR #72 ; `useInstructorInscriptions` sur la fiche |
| BL-042 | `/formateurs`, fiche | Aucun suivi du contrat signé, de l’attestation de vigilance ni du statut administratif, alors que des dossiers sont à régulariser et que `SPEC_UI` le prévoit | gênant (manque) | **clos** — PR #73 (Administratif, statut, contrats) + PR #74 (colonnes / UI vigilance) |
| BL-043 | Fiche inscription, affectation formateur·rice | Après enregistrement, la fiche affiche « Non spécifié » jusqu’au rechargement | gênant | **clos** — PR #73 ; invalidation `inscription-details` + `inscription-ops-fields` (`InscriptionFormDialog`) |
| BL-044 | `/admin/testing`, nettoyage | Le bouton ne couvre pas `test_phrases`. *(live)* la banque compte 445 phrases dont 0 ZZTEST : les huit phrases de test ont disparu avec l’import du point 7, mais le périmètre reste à élargir | gênant | **clos** — PR #72 ; `CleanupZztestCard` + migration `test_phrases` |
| BL-045 | `/students` | *(live)* 35 fiches portent une adresse `import.csv…@fli.placeholder.local` présentée comme valide. Les garde-fous d’envoi existent dans le dépôt (`email-guards.ts`, exclusion dans `PortalInvitesBulkCard`), reste l’affichage « email manquant » | gênant | **clos** — PR #71 ; `studentEmailLabel` (`email-guards.ts`) sur `/students` et fiches liées |
| BL-046 | Déploiement front | Le front publié est en retard sur `main` depuis `cab5b71` (11/09) : constaté aux quatre sessions. Il masque les correctifs invitations en masse, adresses placeholder, checklist et `/auth` en français, réglage de statut, libellés du pack de fin | bloquant (conséquence) | **clos** — publié 19/09 (`plateforme.fli.fr`, deploy `254b23f3`, SHA `a24ccea` incl. #75–#78) |
| BL-047 | Fonctions Edge | Non déployées et `RESEND_API_KEY` absente : `/register`, les emails et le portail par lien magique restent hors recette ; le correctif de nettoyage ZZTEST a lui aussi besoin du déploiement de `cleanup-zztest` | bloquant (conséquence) | **clos** — 19 edges republishées 19/09 ; `RESEND_API_KEY` OK ; Stripe `check-stripe-config` opérationnel |
| BL-048 | Back-office, libellés | « Affichage de 1 stagiaires », « 1 tests complétés », « Nouvelle Facture », « Test de Anglais » / « Test de Espagnol », `auto_entrepreneur` brut, « Note moyenne 0.0 » sans note, titres « Formateurs » / « Ajouter un formateur » non inclusifs, filtres sans libellé sur `/formateurs`, nom de fichier fautif sur `/admin/import` | cosmétique | **clos** — PR #72 |
| BL-049 | `/students` | Une recherche sans résultat affiche « Aucun stagiaire inscrit — les stagiaires apparaîtront ici après leurs inscriptions » au lieu d’un message d’absence de résultat | cosmétique | **clos** — PR #71 ; état `noSearchResults` |
| BL-050 | `/tests` | Banque de questions chinoise à 10 questions contre 90 pour les autres langues | cosmétique (lié au point 7) | **clos** — banques JSON déjà à 25 chacune ; badge `/tests` lit la banque adaptative (suite4), plus le MAX import Google Form (90) |

### Dette antérieure à la recette

| ID | Constat | Priorité |
|----|---------|----------|
| BL-001 | Cartes FLI import sans dry-run/audit alignés `/admin/import` | Avant point 9 |
| BL-002 | Niveaux importés hors référentiel — **clos** PR #30 (entry_level) + #43 (`determined_level` CECRL) ; `docs/POINT_ENTRY_LEVEL.md` | SQL — vague 2 |
| BL-007 | Crons `pg_net` — partiel point 8 ; producteurs notifs UX Vague D (`paiement`, `evaluation`) ; activation `keep_active` reste ouverte | Point 8 / UX D |
| BL-008 | STRIPE_SETUP — **rafraîchi** PR #78 (vérifier via Settings) | Point 6 |
| BL-009 | Docs « purger toutes les données » | Faible |
| BL-010 | Phrases 321 vs 540 — point 7 fusionné | Point 7 |
| BL-011 | `soustraitance` vs `sous_traitance` | Plus tard |
| BL-014 | UI candidat → actif — **partiel** PR #77 (CTA « Passer en actif·ve », défaut `candidat`) | Recrutement |
| BL-015 | Backfill formateur CSV (si restes) | Avant rattachement |
| BL-017 | Imports massifs hors UI | Avant point 9 |
| BL-019 | J-10 horaires FLI exacts + pas de code depuis horaires | Point 10 |
| BL-020 | Policies storage certificats (vue `inscriptions_complete` OK live) | Ops |
| BL-022 | `instructors.cv_url` : 16 liens `drive.google.com`, hors Supabase Storage — rapatriement à cadrer | Faible |

---

## Clos / remplacé

### Écarts de recette déjà traités

| Écart (session) | Gravité | Traitement |
|-----------------|---------|------------|
| `/register` étape 7 : 409 sur `inscriptions`, fiche stagiaire orpheline — `generate_inscription_code` lisait la séquence au 5e caractère (S1, S2) | bloquant | Clos — `docs/POINT_INSCRIPTION_CODE.md` ; vérifié en session 3 (FLI-260006) |
| Pack de fin impossible : passage direct en « terminée » refusé par le contrôle de transition (S3) | bloquant | Clos — PR #37 ; vérifié en session 4 (7.2 bis) |
| Inscription créée hors `/register` sans statut d’horaire, absente du J-10 (S3) | bloquant | Clos — PR #37 ; *(live)* 0 inscription sans `schedule_status` |
| Nettoyage ZZTEST refusé dès qu’un certificat existe dans le stockage (S4) | bloquant (proposé) | Corrigé branche PR #40 — suppression Storage par la fonction Edge en clé service, RPC sans exception ; *(live)* la fonction ne contient plus le refus et lit `invoice_sequence_floor` |
| `/students` : invitations portail en masse sans confirmation (S1) | bloquant | Corrigé `cab5b71` (PR #26) ; déployé Vague 0 (BL-046 clos) |
| Espace stagiaire : certificat affiché deux fois, dont une ligne « CERTIFICAT » (S4) | gênant (proposé) | Corrigé branche PR #40 |
| Espace stagiaire : badge « terminee » brut (S4) | gênant (proposé) | Corrigé branche PR #40 |
| Paiement non rattachable à une facture ni à une inscription (S4) | gênant (proposé) | Corrigé branche PR #40 — `invoice_id` obligatoire, inscription reprise de la facture |
| Marquer une facture « Payée » ne crée aucun encaissement (S4) | gênant (proposé) | Corrigé branche PR #40 — `ensureInvoicePayment` |
| Données de test résiduelles hors convention ZZTEST (S2) | gênant | Clos — *(live)* 0 stagiaire et 0 inscription ZZTEST, aucun paiement hors « Reçu » ; jeu ZZTEST Camille supprimé avec journal |
| Huit phrases ZZTEST dans la banque (S2) | gênant | Clos côté données — *(live)* 0 / 445 ; périmètre nettoyage élargi — PR #72 (BL-044) |
| Code postal « 0000 » sur la fiche stagiaire (S2 2.8) | à confirmer | Clos en session 3.1 : venait de la saisie, pas un défaut |
| `/admin/testing` en portugais, « Resetar » en rouge (S1) | gênant | Corrigé `cab5b71` (PR #26) ; déployé Vague 0 (BL-046 clos) |
| Écran de succès du pack de fin sans numéro de facture (S4) | cosmétique | Corrigé branche PR #40 |
| Onglet Financier : `draft` et `integral` en valeurs techniques (S4) | cosmétique | Corrigé branche PR #40 (`invoiceStatusLabel`, puis `paymentTypeLabel` / `paymentStatusLabel` partout) |
| Onglet Documents : pack de fin libellé « Pack d’inscription » (S4) | cosmétique | Corrigé branche PR #40 |
| Listes de moyens de paiement divergentes entre facture et paiement (S4) | cosmétique | Corrigé branche PR #40 — référentiel unique `payment-methods.ts` |
| Bouton « Créer facture » encore proposé après le pack (S4) | à qualifier | Corrigé branche PR #40 — masqué si une facture existe |
| Bouton « End Pack » en anglais (S3) | cosmétique | Corrigé branche PR #40 |

### Dette antérieure

| ID | Note |
|----|------|
| BL-002 | entry_level + determined_level CECRL — PR #30 / #43 |
| BL-003 | Colonnes formateur — point 3 |
| BL-004 | Exercice fiscal + numérotation — point 2 |
| BL-005 | CECRL hors UI stagiaire (pistes) — point 4 |
| BL-013 | Statut `candidat` |
| BL-018 | Mapping certificat→piste remplacé par bilan Entrée/Sortie |
| BL-021 | Bucket `documents` privé — point A2, `docs/SECURITE_A2_BUCKET_DOCUMENTS.md` |
| BL-006 | Outreach sans unsubscribe — traité par le gel, point 5, `docs/GEL_PROSPECTION_MONITEURS.md`. Condition de réouverture vérifiée à l'exécution. |
| BL-023…026, 028, 036 | Vague 1 — PR #44 |
| BL-029 | Dates flexibles — PR #45 |
| BL-033 | Accents Mac Roman — PR #42 |
| BL-032, 037, 040, 045, 049 | Lot octobre actionnable — PR #71 |
| BL-041, 044, 048 | Suite octobre (fiche formateur, libellés, ZZTEST) — PR #72 |
| BL-042, 043 | Suite 2–3 octobre — PR #73 + #74 (vigilance) |
| BL-030, 035, 050 | Suite 4 octobre — PR #75 |
| BL-027 (partiel), 038 (soft) | Suite 5 octobre — PR #76 |
| BL-038 (hard) | Hard dedup partenaires — PR #80 |
| BL-014 (partiel), Qualiopi/statuts/dashboard | Suite 6 octobre — PR #77 |
| `/documents`, pagination morte, STRIPE_SETUP | Suite 7 octobre — PR #78 |
| BL-046, 047, 031 | Vague 0 deploy 19/09 — front + edges + Resend |
| Onda D5–D8 | Identité org, chrome i18n, import idempotent, CRM leads — PR #70 |

---

## Décisions de la direction enregistrées le 15/09

| Sujet | Décision | ID concerné |
|-------|----------|-------------|
| Compte « Utilisateur Test » | Supprimé | BL-035 |
| Saison | = exercice comptable, 01/07 → 30/06 | BL-034 |
| Moyen de paiement dans `/register` | Aucun coché par défaut tant que le point 6 n’est pas validé | BL-024 |
| « OPCO / FIFPL » | Deux choix distincts ; la règle OPCO viendra de Paula | BL-027 |
| Message d’accueil du test | Signé « l’équipe FLI », réservé aux groupes en station | BL-028 |
| Identité de l’organisation | Paula la remplit elle-même — suppose que `/settings` l’enregistre | BL-036 |
| Certificat | Niveau de sortie en CECRL avec mention SNMSF : conforme ; une piste comme niveau final serait un écart | — |
| Piste non validée | Afficher « Piste verte » côté stagiaire | BL-026 |
| Règle FIFPL | 150 € de frais de dossier + solde par chèque à l’inscription | BL-027 |

---

## Validations points

| Point | Statut livré (= main + déployé) |
|-------|----------------------------------|
| 1 — Import sécurisé | **Livré** — `https://ski-linguist-hub.lovable.app` |
| 2 — Fiscal | **Livré** |
| 3 — Formateurs | **Livré** |
| 4A — Pistes | **Livré** |
| Certificat bilan | **Livré** (vue + backfill live OK) |
| A — `test_evaluations` + certificats | **Livré** — `docs/SECURITE_A_TEST_EVALUATIONS.md` |
| A2 — buckets privés | **Livré** — `docs/SECURITE_A2_BUCKET_DOCUMENTS.md` |
| 5 — Gel prospection moniteurs | **Livré** (PR #18) — `docs/GEL_PROSPECTION_MONITEURS.md` ; edges redeploy 19/09 |
| 7 — Import phrases | Fusionné main — `docs/POINT_7_IMPORT_PHRASES.md` |
| 8 / emails | Pack modèles + tests (PR #34, #49, #50, #62…) — `docs/POINT_8_EMAILS_COMPLET.md` / `EMAILS_8_MINIMAL.md` ; Resend OK (BL-047 clos) |
| 9 — Import facturation | Fusionné main (PR #38…) — `docs/POINT_9_IMPORT_HISTORIQUE.md` |
| 10 — Cycle de vie inscription | **Livré** (PR #37) + front déployé (BL-046 clos) |
| Kit ZZTEST | Fusionné main (PR #21) |
| C.1 — rôle formateur | Fusionné main (PR #22) — `docs/POINT_C1_ROLE_FORMATEUR.md` |
| C.2 — sponsor type | Fusionné main — `docs/POINT_C2_SPONSOR_TYPE.md` |
| C.3 — saisie formateur | Fusionné main — `docs/POINT_C3_SAISIE_FORMATEUR.md` |
| C.4 — vérification Paula | Fusionné main — `docs/POINT_C4_VERIFICATION.md` |
| C.5 — PDF habillages | Fusionné main (PR #28) — `docs/POINT_C5_PDF_HABILLAGES.md` |
| C.6 — export XLSX DSF | Fusionné main (PR #31) — `docs/POINT_C6_XLSX_DSF.md` |
| Vague 1 register/settings (hors règle OPCO) | Fusionné main (PR #44) — BL-023…026, 028, 036 ; BL-029 = PR #45 ; BL-027 partiel (#76) |
| BL-033 accents | Fusionné main (PR #42) — `docs/POINT_BL033_ACCENTS.md` |
| BL-002 niveaux | Fusionné main (PR #30, #43) |
| **Plan produit UX — Vague A** | Fusionné main (PR #60, #61) — `/suivi/:token`, Assister stagiaire/formateur, portail via `app_settings`, `/tests` pistes |
| **Plan produit UX — Vague B** | Fusionné main (PR #63) — checklist fiche, Financier paiements, rail « À traiter », `/student/test` |
| **Plan produit UX — Vague C** | Fusionné main (PR #64) — sidebar Portails/Trésorerie, Pilotage, `canView` |
| **Plan produit UX — Vague D** | Fusionné main (PR #65) — états vides, recherche globale, `/notifications`, pont éval↔stagiaire |
| **PLANO Onda D (D1–D4)** | Fusionné main (PR #67) — pilotage finance, taxonomie langues, `SeasonContext`, journal envois ; hotfix #68 (filtre dates + objectif CA) |
| **PLANO Onda D (D5–D8)** | Fusionné main (PR #70) — identité org sur PDF/emails + logo ; chrome i18n FR ; import upsert/export ; CRM leads (`loss_reason`, `assigned_to`, conversion) |
| **BL octobre lot 1** | Fusionné main (PR #71) — BL-032, 037, 040, 045 (affichage), 049 |
| **BL octobre lot 2** | Fusionné main (PR #72) — BL-041, 044, 048 |
| **BL octobre lot 3** | Fusionné main (PR #73) — BL-043 ; BL-042 Administratif (statut + contrats) |
| **BL octobre lot 4** | Fusionné main (PR #74) — BL-034 saison exercice ; vigilance ; GlobalSearch |
| **BL octobre lot 5** | Fusionné main (PR #75) — BL-035 compte test ; BL-030 en-tête ; BL-050 banque `/tests` |
| **BL octobre lot 6** | Fusionné main (PR #76) — BL-027 choix OPCO/FIFPL ; BL-038 signaux soft partenaires |
| **BL octobre lot 7** | Fusionné main (PR #77) — Qualiopi reset ; statuts stagiaire ; dashboard ; BL-014 CTA candidat |
| **BL octobre lot 8** | Fusionné main (PR #78) — `/documents` honnête ; boutons pagination morts ; STRIPE_SETUP |
| **Vague 0 ops** | **Livré** 19/09 — BL-046 front + BL-047 edges/Resend |
| **BL-038 hard dedup** | Fusionné main (PR #80) — détection + fusion partenaires |
| 6 — Stripe | Config test OK via Settings / `check-stripe-config` ; docs STRIPE_SETUP rafraîchis (#78) ; mode live hors scope |
