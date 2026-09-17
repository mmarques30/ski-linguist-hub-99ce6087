# Emails transactionnels FLI — consignes d'implémentation

Validé par Paula le 17/09/2026. Onze modèles, dix-sept textes avec les variantes. Option A retenue : modèles stockés dans l'app (`email_templates`, écran `/admin/emails`), Resend comme transporteur uniquement.

## Règles transversales

- Expéditeur : `FLI — France Langues International <noreply@fli.fr>` ; Reply-To : `info@fli.fr`. Aligner `process-schedule-reminders` (envoie encore « FLI Formation » sans Reply-To).
- Syntaxe des variables : `{{variable}}` (doubles accolades), substitution dans l'app avant l'appel Resend. Une variable absente ne doit jamais laisser `{{...}}` dans l'email : bloquer l'envoi et journaliser `failed`.
- Français uniquement (pas d'anglais ni de portugais), vouvoiement, écriture inclusive au point médian. Exception unique : `satisfaction_survey_trainer_notice` (formateur·rice) est au tutoiement.
- Signature « L'équipe FLI » et pied de page commun sur tous les modèles sauf le rappel interne (`schedule_validation_reminder`).
- Aucune donnée en dur : dates, noms, montants, lieux, codes sont des variables. Le téléphone et l'adresse de FLI sont les seules constantes.
- Aucun emoji.
- Un texte ne part qu'après « Valider et activer » (RG03). Tout envoi est journalisé dans `email_log` (RG04) avec `template_slug`, destinataire, `inscription_id`, statut, `variables_used`.
- Crons arrêtés jusqu'à validation des tests vers `info@fli.fr` ; `RESEND_API_KEY` à poser ; `resend-webhook` à créer avant d'activer les relances.

## Notion de payeur

Le payeur d'une inscription (stagiaire lui-même, école de ski, partenaire) conditionne plusieurs envois. Les relances de facture s'adressent au payeur, jamais au stagiaire par défaut (`process-invoice-reminders` passe encore le nom et l'email du stagiaire : à corriger). Le dossier FIF-PL (modèle 2) et la variante « payeur stagiaire » du pack de fin (10a) ne partent que si le payeur est le stagiaire. DSF : FLI est sous-traitant, aucune inscription gérée dans l'app.

## Tableau récapitulatif

| # | Slug | Destinataire | Déclencheur | PJ générées par l'app |
|---|---|---|---|---|
| 1a | inscription_confirmation_individual | Stagiaire | Inscription soumise, immédiat (synchrone), type individuel | — |
| 1b | inscription_confirmation_group | Stagiaire | Inscription soumise, immédiat, type collectif | — |
| 2 | inscription_documents | Stagiaire payeur | 30 min après l'inscription, une fois | Convention, programme (données stagiaire + formation), critères FIF-PL, tutoriel |
| 3 | student_portal_invite | Stagiaire | Manuel (fiche ou masse) ; inactif cette saison | — |
| 4 | schedule_validation_reminder | info@fli.fr | J-11 à 7 h 15, puis dès J-10 toutes les 2 h de 8 h à 20 h tant que non réparti | — |
| 5a | invoice_reminder_1 | Payeur | Cron 9 h, échéance + 7 j | — |
| 5b | invoice_reminder_2 | Payeur | Cron 9 h, échéance + 15 j, après 5a | — |
| 5c | invoice_reminder_3 | Payeur | Cron 9 h, échéance + 30 j, après 5b | — |
| 6a | satisfaction_survey_day0 | Tous les stagiaires | Cron 7 h 15 le jour de `end_date` ; jeton créé si absent | — |
| 6b | satisfaction_survey_trainer_notice | Formateur·rice du groupe | Cron dédié 17 h 30 la veille de `end_date` | — |
| 6c | satisfaction_survey_reminder_1 | Stagiaire sans réponse | Cron 8 h 15, `end_date` + 5 j | — |
| 6d | satisfaction_survey_reminder_2 | Stagiaire sans réponse | Cron 8 h 15, `end_date` + 30 j, dernier | — |
| 7 | schedule_convocation | Stagiaire (collectif) | Horaires validés, immédiat ; renvoi « Modification : » si changement | Convocation PDF (optionnel) |
| 8 | convention_to_sign | École | Manuel, une convention par formation ; renvoi « Rappel : » | Convention, programme |
| 10a | training_completion_pack_student | Stagiaire payeur | Auto (cron matin) : formation finie + niveau de sortie saisi + paiement enregistré | Certificat, attestation de présence, facture acquittée |
| 10b | training_completion_pack_school | Stagiaire (payeur école) | Auto (cron matin) : formation finie + niveau de sortie saisi | Certificat |
| 11 | training_completion_school_report | École | Préparé auto quand tous les niveaux du groupe sont saisis et la facture émise ; envoi après validation en un clic | Facture, certificats individuels, tableau des niveaux atteints (nouveau document) |

Le numéro 9 n'est pas utilisé.

## Liste unique des variables (30)

| Variable | Contenu | Modèles |
|---|---|---|
| student_name | Prénom et nom du stagiaire | 1, 2, 3, 6a, 6c, 6d, 7, 10 |
| client_name | Nom du payeur ou de l'école (stagiaire, école, partenaire) | 5, 8, 11 |
| trainer_first_name | Prénom du formateur·rice (tutoiement) | 6b |
| instructor_name | Nom complet du formateur·rice | 7 |
| instructor_phone | Téléphone du formateur·rice ; vide sans consentement explicite sur la fiche | 7 |
| language | Langue de la formation | tous sauf 3, 4, 5 |
| inscription_code | Code d'inscription | 1, 2, 7, 10 |
| dates_label | Dates en clair (« du 12 au 16 janvier 2027 ») | 1 |
| start_date | Date de début | 4, 7, 8, 11 |
| end_date | Date de fin | 6, 7, 8, 10, 11 |
| course_location | Station ou lieu | 1, 6b, 7, 8, 11 |
| location_details | Précision de lieu, champ libre (salle, bâtiment) | 7 |
| modality_label | Présentiel / visio / mixte | 1 |
| slope_label | Piste de départ (jamais un code CECRL) | 1 |
| schedule_label | Groupe et horaires (« Groupe matin, 9 h à 12 h ») | 7 |
| total_hours | Durée totale en heures | 7 |
| student_count | Nombre de stagiaires du groupe | 8, 11 |
| invoice_number | Numéro de facture | 5, 10a, 11 |
| amount | Montant TTC formaté avec devise | 5 |
| due_date | Date d'échéance | 5 |
| days_overdue | Jours de retard | 5b, 5c |
| survey_link | Lien du questionnaire avec jeton (page publique, sans connexion) | 6a, 6c, 6d, 10 |
| magic_link | Lien de connexion à usage unique | 3 |
| link_expiry_label | Durée de validité du lien (« 24 heures ») | 3 |
| dashboard_url | Lien vers l'écran horaires à valider | 4 |
| groups_html | Liste HTML des formations et inscriptions à répartir | 4 (HTML) |
| groups_text | Même liste en texte brut | 4 (TXT) |
| total_count | Nombre d'inscriptions à répartir | 4 |
| days_before | Jours avant le début (11, 10, 9…) | 4 |
| return_deadline | Date limite de retour de la convention signée | 8 |

Noms réservés Resend à ne pas utiliser comme clés : `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`, `contact`, `this`.

## Points d'implémentation

1. Modèle 2 : nouvelle tâche planifiée à +30 min après `submit-registration`, réservée au payeur stagiaire ; générer convention et programme à partir des données de l'inscription.
2. Modèle 4 : remplacer le cron unique J-10 par la logique J-11 puis toutes les 2 h ; `days_before` calculé à chaque envoi.
3. Modèle 6 : trois crons (7 h 15, 8 h 15, 17 h 30). La page d'enquête doit être publique (jeton) et lisible sur téléphone. Le jeton doit exister le matin du dernier jour, pas seulement au pack de fin.
4. Modèle 7 : nouvelle fonction `send-schedule-convocation`, appelée à la validation des horaires ; champ `location_details` sur la formation ; consentement téléphone sur la fiche formateur·rice.
5. Modèle 8 : nouvelle fonction `send-convention` avec PJ ; concerne les écoles uniquement (la convention individuelle part avec le modèle 2).
6. Modèles 10 et 11 : le pack de fin devient un envoi automatique conditionné au formulaire de sortie ; le 11 reste à un clic de validation ; nouveau document « tableau des niveaux atteints » (niveau de sortie uniquement, sans niveau d'entrée ni assiduité).
7. Sécurité d'envoi : aucun envoi automatique la nuit (crons entre 7 h et 20 h) ; blocage si une variable est vide sur un champ obligatoire.
8. Ordre avant activation : `RESEND_API_KEY` posée → textes publiés sur `/admin/emails` → correction du payeur dans les relances → tests `send-test-email` vers `info@fli.fr` → `resend-webhook` créé → crons activés un par un après validation Paula.

## Fichiers

Un dossier par variante : `slug.html` (gabarit mobile, styles inline, largeur 560 px), `slug.txt` (version texte avec le sujet en première ligne), `slug.meta.txt` (slug, sujet, destinataire, déclencheur, variables). `_index.json` reprend l'ensemble.
