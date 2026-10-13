# Triage des findings Critical (aucun correctif appliqué)

Source : le dernier résultat Critical disponible (scan du 7 oct., marqué « incomplet »). Beaucoup de lignes sont des doublons : on obtient 17 sujets distincts.

Point clé : les fonctions marquées « réservées au cron » (verify_jwt = true) acceptent n'importe quel jeton valide, y compris la **clé publique de l'app**. Ce réglage ne protège donc pas contre un inconnu.

## P1 — Vrai risque, accès public possible, envois d'e-mails ou données personnelles
| # | Finding | Fonction / table | Verdict |
|---|---|---|---|
| 1 | Envoi en masse d'e-mails aux moniteurs, lecture des contacts moniteurs (5 doublons) | process-intake-outreach | **Vrai risque** : aucune vérification de rôle, 4047 contacts exposés |
| 2 | N'importe qui peut envoyer le dossier ou les documents d'un stagiaire (force=true), supprimer ou recréer document_sendings (6 doublons) | send-inscription-documents | **Vrai risque** : aucun contrôle de rôle |
| 3 | Lecture des factures impayées (élève et partenaire) | process-invoice-reminders | **Vrai risque** (clé publique suffit) |
| 4 | Lecture des plannings et contacts élèves, modification des dates de rappel | process-schedule-reminders | **Vrai risque** |
| 5 | Modification des rappels de satisfaction | process-survey-reminders | Vrai risque, impact faible |
| 6 | dry_run renvoie les actions de paiement des élèves | send-daily-ops-digest | **Vrai risque** |
| 7 | Génération des charges mensuelles | generate-monthly-charges | Vrai risque, impact moyen |
| 8 | Tout utilisateur connecté peut déclencher les e-mails de demande CFP | send-rosiere-cfp-request | Vrai risque : comptes stagiaire et formateur inclus |

## P2 — Vrai risque, formulaire public d'inscription
| # | Finding | Fonction | Verdict |
|---|---|---|---|
| 9 | Prix choisi par le client quand aucune offre catalogue ne s'applique, ensuite facturé par Stripe | submit-registration + create-registration-checkout | **Vrai risque paiement** |
| 10 | Écrasement des coordonnées ou inscriptions d'un élève existant à partir de son e-mail | submit-registration | **Vrai risque** (aucune vérification de la boîte mail) |
| 11 | Dépôt de fichiers dans le dossier privé d'un autre élève (3 doublons) | upload-registration-document | Vrai risque, impact moyen |
| 12 | Lire une inscription avec son ID et l'e-mail associé | create-registration-checkout | Risque faible : il faut connaître les deux |
| 13 | Estimation FIF-PL et niveau de placement déclarés par le client (6 doublons) | submit-registration | **Faux positif probable** : déclaratif voulu, vérifié par l'équipe FLI |

## P3 — Comptes connectés seulement
| # | Finding | Concerné | Verdict |
|---|---|---|---|
| 14 | Tout utilisateur connecté peut changer la saison active et donc les tarifs | fonction activate_season | **Vrai risque** (stagiaire inclus) |
| 15 | Taux de présence d'un autre élève visible | fonction compute_attendance_rate | Vrai risque, impact faible |
| 16 | Un formateur peut télécharger tous les PDF d'évaluation (2 doublons) | sign-private-download | Contraire à la règle « formateurs : accès global » : **faux positif selon la politique FLI** |
| 17 | Recherche globale : texte injecté dans les filtres formateurs et paiements | GlobalSearch | Risque faible : interface staff, RLS toujours appliquée |

## Paiement
- « Confirmer une inscription via le retour de paiement » (verify-registration-checkout) : **faux positif**. La session est revérifiée « paid » auprès de Stripe, et un sessionId réel ne s'obtient qu'en payant.
- check-stripe-config public : expose l'état de la configuration (aucune clé). Risque faible.
- stripe-webhook : non signalé (la signature est vérifiée).

## Prochaine étape proposée (sur accord de Paula)
Corriger dans cet ordre : n° 1, 2, 3, 4, 6, 9, 10, 14, puis les autres. Aucune modification avant validation.
