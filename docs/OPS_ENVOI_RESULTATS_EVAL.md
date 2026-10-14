# Envoi des résultats d’évaluation — process ops

Statut : **process manuel / scripts** validé sur le lot Mollard octobre 2026.  
L’app génère les PDF C.5 (`generate-evaluation-pdf`) mais **n’envoie pas encore** les résultats (pas de corps inventé — C.5). Les envois partent via Resend après **validation explicite de Paula**.

Voir aussi : `docs/POINT_C5_PDF_HABILLAGES.md` (habillages PDF), `docs/evaluation-resultats/` (modèles Word).

## Règles transversales

| Règle | Détail |
|-------|--------|
| Validation | Aucun envoi sans OK Paula (brouillon montré, puis feu vert) |
| Expéditeur | `FLI — France Langues International <noreply@fli.fr>` · Reply-To `info@fli.fr` |
| BCC | Toujours `info@fli.fr` |
| Impayés | **Ne pas** envoyer le résultat au candidat tant que le test n’est pas payé |
| Lien / facture à régler | Joindre le RIB FLI (coordonnées sur la facture ou bloc `FLI_BANK_DETAILS`) |
| Journal | Après envoi : `email_log` + facture `draft` → `sent` si applicable |
| Confirmation chat | Destinataire, objet, id Resend, BCC |

Scripts ops : `SEND=1 ./node_modules/.bin/tsx scripts/send-….mts` (sans `SEND=1` = dry-run).

---

## Cas A — Candidat autofinancé (école de ski / ESF)

**Destinataires**

- **À :** e-mail du candidat  
- **CC :** les **2** contacts école (secrétariat + direction / 2e adresse connue)  
- Exception ponctuelle Paula : mauvais résultat → candidat seul (ex. Montaine 1er test)

**Pièces jointes**

1. Résultat PDF (habillage C.5 `esf` ou `ecole_ski`)  
2. Facture **acquittée** individuelle (si le candidat a payé)

**Objet type**  
`Résultat de votre test de langue — Prénom Nom`

**Facture école déjà groupée**  
Si l’école a une facture groupée à part : joindre seulement le PDF résultat au candidat ; indiquer que la facture a été adressée à l’école.

**Réf. scripts**  
`scripts/send-mollard-remaining-results.mts`, `scripts/send-courchevel-1550-results.mts`

---

## Cas B — École facturée (résultats sans facture individuelle)

**Destinataires**

- **À :** chaque candidat  
- **CC :** contact(s) école (ex. `administration@…`)  
- **Pas** de facture en PJ du mail candidat

**Facturation**

- Facture **école** groupée en fin de période (ou message directeur·rice : « facture complète fin de mois »)  
- Ou facture école dédiée tout de suite (ex. ESF Les Carroz → secrétariat + CC direction)

**Réf. scripts**  
`scripts/send-st-gervais-results.mts` · `scripts/send-carroz-school-invoice.mts`

---

## Cas C — DSF (sous-traitance Domaines Skiables de France)

FLI est sous-traitant ; pas d’inscription stagiaire dans l’app pour ces tests.

**Destinataire principal**  
Contact DSF Formation (ex. Fabienne Rozier `f.rozier@domaines-skiables.fr`) — tutoiement si relation établie.

**Pièces jointes (ordre recommandé)**

1. Résultat **PDF** — mise en page **identique** au `.dotx` DSF  
2. Même résultat en **Word modifiable** (`.docx` = `.dotx` rempli)  
3. **Tableau des niveaux** (session / grosse session) : compétences + niveau final  
4. **Facture à régler** (HT + TTC, échéance, RIB)  
5. Contrat de prestation (si utile / demandé)

**Mise en page**

- Modèle : `docs/evaluation-resultats/Resultat_eval_DSF_forms.dotx`  
- Remplissage MERGEFIELD + pied « Version du JJ/MM/AAAA » : `scripts/fill-dsf-eval-dotx.py`  
- Conversion PDF : LibreOffice headless (`soffice --headless --convert-to pdf`)  
- **Ne pas** reconstruire le PDF DSF à la main en pdf-lib pour un envoi Word/PDF officiel — le `.dotx` fait foi

**Corps mail (phase nouveau système)**  
Préciser si besoin : premier envoi depuis le nouveau système de gestion ; mails automatiques ; phase de test → possibles coquilles ; invitation à revenir pour corrections.

**Réf. scripts**  
`scripts/fill-dsf-eval-dotx.py` · `scripts/prepare-dsf-mandica-word.py` · `scripts/prepare-dsf-mandica-pack.mts` · `scripts/send-dsf-mandica-fabienne.mts`

---

## Modèles Word versionnés

| Fichier | Usage |
|---------|--------|
| `docs/evaluation-resultats/Resultat_eval_DSF_forms.dotx` | Résultat DSF (papier à en-tête DSF + formulaire) |
| `docs/evaluation-resultats/Evaluation_en_langue_vivante_saison.dotx` | Référence saison ESF / moniteurs (MERGEFIELD) ; PDF app = C.5 |

Détail des champs : `docs/evaluation-resultats/README.md`.

---

## Création d’une évaluation (espace formateur)

Sur `/formateur/evaluations` → bouton **Nouvelle évaluation** :

1. Saisie identité candidat, école, langue, date du test, commanditaire (ESF / école / DSF)
2. RPC `create_formateur_evaluation_booking` → candidat + réservation `completed` (`source = formateur_ui`)
3. Redirection vers `/formateur/evaluation/:bookingId` pour la saisie des notes

Staff (hors mode Assister) : même bouton, avec choix du formateur·rice.  
Migration : `20261014140000_create_formateur_evaluation_booking.sql`.

---

## Checklist avant envoi

1. [ ] PDF / Word / facture / tableau relus  
2. [ ] Impayés exclus  
3. [ ] CC école = 2 adresses quand cas A  
4. [ ] BCC `info@fli.fr`  
5. [ ] Brouillon corps validé par Paula  
6. [ ] `SEND=1` puis noter id Resend + maj `email_log` / statut facture
