# Triage des findings Critical — scan du 13 oct. 2026 (aucun correctif)

Source : le scan détaillé (« deep », statut incomplete) cumule ses findings du 7, 12 et 13 oct. Le Quick scan base (lov_pgscan) : 0 finding. Les 51 lignes Critical se ramènent à **19 trous distincts**.

| # | Finding (dédoublonné) | Cible | Lignes | Statut |
|---|---|---|---|---|
| 1 | Envoi de prospection en masse / lecture des contacts moniteurs | edge process-intake-outreach | 7 | Corrigé en prod (#182, admin ou service_role) |
| 2 | Envoi des documents d'inscription à n'importe quel stagiaire / insertion de documents | edge send-inscription-documents | 7 | Corrigé (#182, staff ou service_role) |
| 3 | Lecture et modification des rappels planning | edge process-schedule-reminders (+ config.toml) | 4 | Corrigé (#182) |
| 4 | Détail des factures impayées | edge process-invoice-reminders | 1 | Corrigé (#182) |
| 5 | Actions de paiement dans le digest | edge send-daily-ops-digest | 1 | Corrigé (#182) |
| 6 | Modification des rappels d'enquête | edge process-survey-reminders | 1 | Corrigé (#183, testé : anon → 403) |
| 7 | Génération des charges mensuelles | edge generate-monthly-charges | 1 | Corrigé (#183) |
| 8 | Mails de demande CFP Rosière | edge send-rosiere-cfp-request | 2 | Corrigé (#183) |
| 9 | Dépôt dans le dossier d'un autre stagiaire | edge upload-registration-document | 3 | Corrigé (#183, testé) |
| 10 | Changement de la saison active | RPC activate_season | 1 | Corrigé (migration is_staff appliquée) |
| 11 | Prix de la formation choisi par le client | edge submit-registration | 2 | Corrigé (#182, prix recalculé serveur) |
| 12 | Écrasement des coordonnées d'un stagiaire existant | edge submit-registration | 2 | Corrigé (#182, plus de mise à jour) |
| 13 | Estimation FIF-PL réduite par le client | edge submit-registration | 7 | Faux positif probable : estimation indicative, recopiée en note ; seul « coveredOnCourseEur » mérite une vérification |
| 14 | Niveau d'entrée choisi par le client | edge submit-registration (entry_level) | 3 | Faux positif probable : niveau déclaratif, remplacé par le test de placement |
| 15 | Confirmation d'inscription via le retour de paiement | edge verify-registration-checkout | 1 | Faux positif probable : la session est relue chez Stripe et doit être « paid » ; on ne peut confirmer sans avoir payé |
| 16 | Lecture des statuts Stripe | edge check-stripe-config | 1 | Vrai reste, faible : aucun contrôle de connexion ; renvoie des infos de config, pas les clés |
| 17 | Tout formateur télécharge tous les PDF d'évaluation | edge sign-private-download | 2 | Vrai reste (contrôle de connexion, mais pas « ce formateur, ce dossier ») ; conforme à la règle « formateurs = accès global », donc à arbitrer par Paula |
| 18 | Taux de présence d'un autre stagiaire | RPC compute_attendance_rate (GRANT authenticated) | 2 | Vrai reste : un stagiaire connecté peut interroger n'importe quelle inscription |
| 19 | Lecture de dossiers d'autres inscrits avec un ID et un e-mail / prix des cours modifiables | create-registration-checkout ; pricing_rules (useSeasons) | 2 | Checkout : corrigé (#182). pricing_rules : faux positif (staff seulement, règle voulue) |
| 20 | « Injection » dans la recherche globale | front GlobalSearch (.or ilike) | 2 | Faux positif : filtre de lecture côté staff, la RLS s'applique quand même |

## Ops Vault
Aucun finding ne vise `edge_dispatch_jwt`. Mais tant que le support n'a pas fait la rotation, les tâches automatiques des fonctions 1 à 7 sont refusées (403) : sécurité OK, fonctionnement en panne.

## Que veulent dire « 46 » et « 27 Critical » ?
Ce sont surtout des **doublons**. Le scan détaillé n'a jamais fini, et il garde ses findings du 7, 12 et 13 oct. sans fermer ceux qui sont corrigés : 51 lignes pour environ 19 sujets, et une seule date (13 oct.) pour les mêmes cibles. Les lignes du 13 oct. sont des redétections sur des fonctions déjà corrigées (le scan lit peut-être une version antérieure du code), pas des nouvelles cibles.
**Vrais restes** : #18 (taux de présence), #17 (à arbitrer), #16 (faible). À vérifier : la partie « coveredOnCourseEur » de #13.
Pour faire baisser le compteur, il faut qu'un scan détaillé aille au bout, puis marquer comme corrigés les findings 1 à 12.
