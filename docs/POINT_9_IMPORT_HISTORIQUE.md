# Point 9 — import des factures historiques

**État : CSV Paula reçu le 15/09/2026** (`facturation_FLI_2026_09_15.csv`).
L'import réel se fait depuis **Administration → Import**, carte
« Tableur FLI — Facturation historique ». Dry-run (totaux + rattachement)
avant toute écriture.

Le CSV n'est **pas** versé au dépôt (données nominatives).

## Fichier

- 1 292 factures, `20-21.13010` → `26-27.14302`
- Séquence continue **sauf 13288** (trou de décembre 2021, à conserver)
- UTF-8 BOM, `;`, dates ISO, décimales à virgule
- Numéros d'origine (`Fact FLI`) **jamais renumérotés**

## Règles de mapping

| Sujet | Règle |
|---|---|
| Type | TVA montant = 0 → `formation`. TVA ≠ 0 → `test`, sauf désignation « encadrement » → `soustraitance`. Graphies (`Tstes`, `testes`) et avoirs à TVA non nulle : rapportés, classés test. |
| Moyen de paiement | `Chèque` / `Virement` / `CB` → payée. `à régler` → impayée (`sent`). `avoir` et `annulée` sont des **statuts**, pas des moyens. Vide → liste « à demander à Paula ». `facturé à l'ESF` → `client_type = ecole_ski`. |
| Rattachement | nom + date de début + langue. Non-rattachées attendues nombreuses sur 2020-2022. Ambiguës non rattachées. |
| Barrière 01/10/2025 | **non appliquée** sur cette carte : le fichier inclut 25-26 et 26-27 avec leurs numéros d'origine. La barrière reste sur l'import CSV générique. |

## Plancher de numérotation

Avant import, `invoices` est vide : l'ancien plancher 14297 donnerait 14298 à la
prochaine facture saisie et entrerait en collision avec le CSV.

Migration `20260915160000_point9_plancher_14302.sql` : plancher **14302**.
Après import, `MAX(sequence_number) = 14302` : le plancher est redondant avec
le max.

## Totaux du CSV (dry-run, aucune écriture)

Voir l'écran : HT / TVA / TTC par exercice, à comparer aux totaux de
l'expert-comptable. L'écriture n'est possible qu'après le dry-run de
rattachement.
