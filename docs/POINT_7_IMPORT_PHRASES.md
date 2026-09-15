# Point 7 — Import de `test_phrases_complete.json`

## Ce que contient le fichier

| | |
| --- | --- |
| Métadonnée `total_phrases` | 540 |
| Phrases réellement présentes | **445** |
| Codes manquants ou en double | 0 |
| Corrections / explications | 96 / 349 (la métadonnée du fichier annonce 95 / 350) |
| Phrases avec `context` | 155 |
| Phrases avec `error_type` | 290 |

L'écart 540 / 445 vient du fichier lui-même : le tableau `phrases` s'arrête à 445.
Les 445 phrases présentes sont importées **sans dédoublonnage ni renommage**, l'écart
est signalé dans l'écran d'import et dans le journal.

### Encodage

Le fichier fourni était en double encodage UTF-8 (`Ã©` au lieu de `é`, `Ã ` au lieu de
`à`) avec les cinq octets non mappés par cp1252 (`0x81 0x8D 0x8F 0x90 0x9D`). La copie
de référence du dépôt (`src/data/test_phrases_complete.json`) est réencodée en UTF-8
propre ; aucun autre changement, aucun texte réécrit. Un test vérifie qu'il ne reste
aucune séquence mojibake (`Ã` suivi d'un caractère latin‑1 haut, `â€`, `U+FFFD`), tout
en laissant passer le `-ÃO` légitime du portugais.

## Étiquettes conservées telles quelles

Langue et catégorie restent les étiquettes du fichier. Rien n'est traduit en base ;
la traduction n'existe qu'à l'affichage.

| Langue | Phrases | | Catégorie | Phrases |
| --- | --- | --- | --- | --- |
| COMMON (toutes langues) | 45 | | INTRODUCTION | 15 |
| EN | 82 | | COMPREHENSION | 20 |
| FR | 49 | | CONCLUSION | 10 |
| DE | 42 | | PRONONCIATION | 96 |
| PT | 40 | | GRAMMAIRE | 194 |
| ES | 40 | | VOCABULAIRE | 110 |
| IT | 39 | | | |
| NL | 36 | | | |
| RU | 36 | | | |
| ZH | 36 | | | |

## Schéma

`test_phrases` gagne trois colonnes reprenant les champs du fichier sans équivalent :

- `context` — texte libre (« Accueil candidat », « Consigne »…), présent sur 155 phrases ;
- `is_correction` — `true` = correction adressée au candidat, `false` = explication ;
- `error_type` — point de langue visé (« Accord participe », « Jota »…), 290 phrases.

`is_positive`, qui existait déjà, est aligné sur `NOT is_correction`.

Deux contraintes changent :

- `test_phrases_category_check` n'acceptait que les six catégories de l'application
  (`introduction`, `comprehension`, `expression`, `grammar`, `technique`, `conclusion`).
  Elle accepte désormais les six étiquettes du fichier.
- un index unique non partiel sur `code` permet la reprise d'import (`ON CONFLICT (code)`).
  Plusieurs phrases sans code restent possibles.

## Sélecteur adapté au fichier

Les catégories du fichier ne correspondent pas aux quatre blocs du compte-rendu
(introduction, compréhension, technique, conclusion) : il n'y a pas de catégorie
« TECHNIQUE » dans le fichier, et il y a trois catégories transverses
(PRONONCIATION, GRAMMAIRE, VOCABULAIRE).

Le sélecteur ne lie donc plus une catégorie à un bloc. Dans chaque bloc :

- deux listes déroulantes, **langue** et **catégorie**, alimentées par les étiquettes
  réellement présentes en base ;
- une recherche libre sur le texte, le code, le point de langue et le contexte,
  insensible à la casse et aux accents ;
- un bouton **Insérer** par phrase, qui l'ajoute **au bloc courant, quel qu'il soit** ;
- un rappel des phrases déjà dans le bloc, avec retrait possible.

Une langue précise remonte toujours aussi les phrases `COMMON`, valables partout.
La langue du test présélectionne l'étiquette correspondante (`anglais` → `EN`,
`portugais` → `PT`, `fle` → `FR`…).

### Reprise d'un brouillon

`selected_phrase_ids` est stocké à plat : la catégorie ne dit plus dans quel bloc une
phrase a été insérée. À la réouverture, chaque phrase est rattachée au bloc dont le
texte enregistré la contient, et le commentaire libre est reconstitué en retirant les
textes de phrases — sinon ils étaient réécrits une seconde fois à l'enregistrement.

## Journal

`audit_log.action = 'import_test_phrases'`, `table_name = 'test_phrases'` :
total, comptage par langue, comptage par catégorie, corrections / explications,
nombre de `context` et de `error_type`. Aucune donnée personnelle.
