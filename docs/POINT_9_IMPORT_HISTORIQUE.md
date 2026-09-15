# Point 9 — import des factures et paiements historiques

**État : chemin d'import prêt et vérifié, import réel en attente du fichier de Paula.**

Le fichier Excel des factures et paiements historiques n'a pas été fourni avec
cette demande. Ce lot livre donc la partie que je peux livrer sans lui : le
chemin d'import sanctionné, avec la vérification de dates demandée
(« antérieures au 01/10/2025 ») appliquée mécaniquement plutôt qu'à l'œil.

## 1. Où passe l'import

`/admin/import` → table cible **`payments (paiements)`** ou
**`invoices (factures)`**, puis dry-run, puis « Écrire en base ».

C'est la règle posée au point 1 : imports massifs par `/admin/import`, dry-run
journalisé avant écriture journalisée. Les deux étapes écrivent dans
`audit_log`.

## 2. La barrière de date

L'exercice fiscal FLI court d'octobre à septembre, et l'exercice courant a
commencé le **01/10/2025**. Une pièce historique datée à partir de ce jour se
retrouverait dans l'exercice en cours et fausserait la numérotation fiscale
posée au point 2.

L'écran affiche donc, pour `invoices` et `payments`, un interrupteur **actif par
défaut** : « Import historique : refuser les dates du 2025-10-01 ou
postérieures ». La barrière porte sur toutes les dates de la ligne :

| Table | Champs contrôlés |
|---|---|
| `invoices` | `invoice_date`, `payment_date` |
| `payments` | `payment_date`, `cheque_date` |

Une ligne hors périmètre est rejetée avec son numéro de ligne et son motif, puis
reste téléchargeable dans le CSV des rejets. Elle n'est jamais écrite.

L'interrupteur se décoche pour saisir une pièce de l'exercice en cours. Le
choix est journalisé : `audit_log.new_values.barriere_historique` vaut
`2025-10-01` ou `null`.

## 3. Facture sans date : rejet, plus de repli

Avant ce lot, `mapInvoiceRow` remplaçait une `invoice_date` vide par la date du
jour. Sur un import historique, une facture de 2024 sans date lisible serait
donc devenue une facture de 2026, dans le mauvais exercice, sans aucun signal.

La ligne est maintenant rejetée :

```
invoice_date manquante : une facture historique doit porter sa date d'origine
```

Même règle pour `payment_date` côté paiements.

## 4. Table `payments` : nouvelle cible d'import

`payments` n'était pas importable : le moteur ne connaissait que cinq tables.
Le mappage respecte les contraintes de la base et accepte des en-têtes
françaises.

| Colonne | En-têtes acceptées | Règle |
|---|---|---|
| `payment_date` | `payment_date`, `Date paiement`, `Date` | obligatoire, `JJ/MM/AAAA` ou ISO |
| `amount` | `amount`, `Montant` | obligatoire, décimale à virgule, milliers avec espace |
| `payment_method` | `payment_method`, `Mode de paiement`, `Mode`, `Moyen` | obligatoire |
| `payment_type` | `payment_type`, `Type de paiement`, `Type` | `total` par défaut |
| `payer_type` | `payer_type`, `Payeur` | `stagiaire` par défaut ; `esf` devient `ecole` |
| `reference` | `reference`, `Référence`, `Ref` | — |
| `payer_name` | `payer_name`, `Nom du payeur` | — |
| `cheque_number` | `cheque_number`, `Numéro de chèque` | — |
| `cheque_bank` | `cheque_bank`, `Banque` | — |
| `cheque_date` | `cheque_date`, `Date du chèque` | soumise à la barrière |
| `currency` | `currency`, `Devise` | `EUR` par défaut |
| `invoice_id`, `inscription_id` | idem | UUID, facultatifs |

Normalisations, pour coller aux contraintes `CHECK` :

- **Mode** — `virement` (aussi `transfert`, `transfer`), `cheque` (aussi `chq`),
  `especes` (aussi `espèces`, `liquide`, `cash`), `cb` (aussi `carte`,
  `carte bancaire`), `stripe`. Tout autre libellé est rejeté.
- **Type** — `acompte` (aussi `adiantamento`), `partial` (aussi `partiel`,
  `solde`, `saldo`), `total` (aussi `integral`, `intégral`).

Les accents et la casse sont ignorés à la comparaison.

## 5. Ce qu'il faut de Paula pour l'import réel

1. Le fichier des **factures** et celui des **paiements**, en CSV `;` UTF-8
   (un export depuis l'Excel suffit).
2. Pour les factures, les numéros d'origine dans `invoice_number` : le point 2
   a vérifié qu'un numéro fourni est **conservé** et que la séquence
   automatique reprend au-dessus de 14297. Une facture importée sans numéro
   recevrait un numéro neuf de l'exercice courant, ce qui n'est pas voulu.
3. Le rattachement, s'il est connu : `inscription_id` pour les factures,
   `invoice_id` ou `inscription_id` pour les paiements. Ces champs sont
   facultatifs : un paiement peut être importé sans rattachement puis rapproché
   ensuite.

Ordre d'import : **`invoices` avant `payments`**, pour que `invoice_id` puisse
être renseigné.

## 6. Vérification effectuée

`src/lib/admin-import-engine.test.ts` — 12 cas : acceptation d'une pièce du
15/08/2025, rejet du 01/10/2025 (premier jour de l'exercice courant), rejet
d'une date postérieure avec son numéro de ligne, levée de la barrière,
rejet d'une date de paiement récente sur une facture ancienne, facture sans
date, normalisation des modes et types, mode hors contrainte, paiement sans
date, paiement sans montant.

Essai en ligne sur `/admin/import` avec un CSV de 7 lignes (dates mêlées,
libellés français, un mode invalide, une date absente) :

```
7 lignes lues · 3 acceptées · 4 rejetées

Ligne 5 : Date de paiement 2025-10-01 n'est pas antérieure au 2025-10-01 : hors périmètre de l'import historique
Ligne 6 : Date de paiement 2026-01-12 n'est pas antérieure au 2025-10-01 : hors périmètre de l'import historique
Ligne 7 : Mode de paiement invalide : bitcoin (attendu : virement | cheque | especes | cb | stripe)
Ligne 8 : payment_date manquante : un paiement historique doit porter sa date d'origine
```

Écriture des 3 lignes acceptées, journalisée :

```json
{
  "filename": "zztest_paiements_historiques.csv",
  "total_rows": 7,
  "accepted_at_dry_run": 3,
  "rejected_at_dry_run": 4,
  "barriere_historique": "2025-10-01",
  "imported": 3,
  "write_errors": []
}
```

Le jeu d'essai a été supprimé ensuite : `payments` est revenue à 0 ligne.
