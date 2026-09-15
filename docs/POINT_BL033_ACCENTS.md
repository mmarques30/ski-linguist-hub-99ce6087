# BL-033 — accents perdus à l'import (Mac Roman lu comme UTF-8)

Migration : `supabase/migrations/20260915210000_bl033_fix_macroman.sql`
Backlog : BL-033 (bloquant), BL-002 (seconde moitié, voir §7)
Date : 2026-09-15
Dry-run hors dépôt : `/opt/cursor/artifacts/bl033_accents_dry_run.md`
Journal : `audit_log.action = 'bl033_correction_accents_macroman'` et
`'bl033_dedoublonnage_encodage'`

---

## 1. Constat

Le lot d'import du 29/07/2026 a été lu en **Mac Roman** au lieu d'UTF-8. Les
octets de la table Mac Roman ont été conservés tels quels comme points de code
Unicode : « Débutant » était stocké « D<U+008E>butant », qui s'affiche
« Dbutant » puisque U+008E est un caractère de contrôle invisible.

L'accent n'était donc pas perdu : il était stocké sous une forme invisible.
La correction est déterministe et n'invente rien.

| Table | Lignes concernées | Total |
|---|---|---|
| `inscriptions` | 690 | 886 |
| `students` | 224 | 664 |
| `partners` | 26 | 1 033 |
| `partner_contacts` | 1 | 209 |
| `ski_monitors` | 1 | 4 047 |

2 082 valeurs sur 26 colonnes, dont les noms et prénoms des stagiaires, les
villes, les adresses de cours, les langues et les libellés `inscriptions.code`
qui servent d'intitulé de formation sur les documents.

## 2. Table de correspondance

La fonction `public.fix_macroman(text)` porte la correspondance complète et son
raisonnement. Deux zones, deux niveaux de certitude.

**Zone de contrôle C1 (0x80–0x9F)** — 17 octets présents, aucune ambiguïté
possible : ces points de code n'existent pas dans du texte légitime.
0x8E → é, 0x8F → è, 0x88 → à, 0x91 → ë, 0x89 → â, 0x99 → ô, 0x94 → î,
0x90 → ê, 0x8D → ç, 0x95 → ï, 0x9E → û, 0x83 → É, 0x87 → á, 0x82 → Ç,
0x8B → ã, 0x9D → ù, 0x9C → ú. La table 0x80–0x9F est appliquée en entier pour
rester utilisable sur un prochain import.

Vraisemblance vérifiée sur des mots dont l'orthographe tranche : « Samo**ë**ns »,
« Ch**â**tel », « Beno**î**t », « 10-ao**û**t-26 », « BRIAN**Ç**ON »,
« Ath**é**na**ï**s », « Fran**ç**ois ».

**Zone haute** — cinq caractères ont survécu à l'identique et demandent un
contexte, vérifié occurrence par occurrence :

| Caractère | Corrigé en | Condition |
|---|---|---|
| `Ð` (0xD0) | `–` | aucune : 41 occurrences, toutes isolées |
| `Ë` (0xCB) | `À` | aucune : 13 occurrences, toutes isolées (« Ë L'Attention De… ») |
| `¡` (0xA1) | `°` | aucune : 6 occurrences, toutes dans « N¡1 » |
| `Õ` (0xD5) | `’` | précédé d'une lettre (« lÕaise », « DÕOisans ») |
| `Ê` (0xCA) | espace insécable | sauf dans « Être » et « Êtes » |
| `æ` (0xE6) | `Ê` | seulement dans « ætre » |

Laissés intacts, car lisibles et absents des lignes abîmées : `À`, `È`, `Ç`,
`Â`, `Ô`, `°`, `«`, `»`, `·`.

## 3. Ce que le dry-run a évité

Deux faux positifs, tous deux dans la banque de phrases du test de niveau :

1. « **Êtes**-vous prêt(e) à commencer ? » — une première version de la règle
   ne protégeait que « Être » et produisait « tes-vous ».
2. « Le pluriel des mots en -ÃO peut être -**ÕES**, -ÃES ou -ÃOS » — le Õ
   portugais est légitime. D'où la condition « précédé d'une lettre » : ici il
   suit un tiret.

Après correction des règles, `test_phrases` n'avait plus aucune valeur à
modifier : ses deux seules lignes candidates étaient ces faux positifs.

Un contrôle qualité a ensuite balayé tout le jeu à la recherche, **après**
correction, d'un reste de zone C1 ou d'une majuscule accentuée intercalée dans
un mot. Il a isolé deux valeurs dont l'octet d'origine ne suit pas la table
Mac Roman, traitées à part et journalisées :

| Champ | Octets | Ce que la table aurait donné | Corrigé en |
|---|---|---|---|
| `inscriptions.language` (1 ligne) | `br` + 0x8D + `silien` | « brçsilien » | « Portugais brésilien », par normalisation sur le référentiel |
| `inscriptions.rhythm` (1 ligne) | `disponibilit` + 0x8E + 0x82 + `s` | « disponibilitéÇs » | « disponibilités », octet parasite supprimé |

## 4. Unicité de `inscriptions.code` — 8 doublons fusionnés

`inscriptions.code` porte un index unique et contient des libellés descriptifs.
Huit paires ne différaient que par l'encodage et devenaient identiques après
correction : la correction a donc été précédée d'une fusion.

Règle appliquée, identique à celle du dédoublonnage précédent : **on garde la
fiche qui porte le formateur** — dans les huit cas c'est aussi celle qui était
déjà propre en UTF-8. Avant suppression, les champs que seule la fiche
supprimée renseignait sont reportés sur la gardée (`entry_test_id`,
`expectations`, `course_address`, `duration_hours`, `schedule`), et les objets
rattachés sont réaffectés sur les 15 tables qui référencent `inscriptions`
(5 tests de positionnement l'étaient).

`inscriptions` passe de 886 à 878 lignes. Les 11 inscriptions sans `code` ne
sont pas concernées : l'index unique autorise plusieurs valeurs nulles.

## 5. Exception au gel du point 5

`partners` et `ski_monitors` sont en lecture seule (BL-006). Les 27 valeurs à
corriger sur ces deux tables relèvent de la qualité de données, pas de la
prospection : un nom de partenaire faux se retrouve sur les factures.

Procédure suivie, identique à l'exception C.3 déjà documentée : déclencheurs
`gel_prospection_partners` et `gel_prospection_ski_monitors` désactivés le temps
des seules instructions de correction, rétablis immédiatement après, **contrôle
négatif effectué** (une écriture sur `partners` lève à nouveau `P0001`).
Journalisé dans `audit_log`.

## 6. Vérifications après écriture

| Contrôle | Résultat |
|---|---|
| Restes de la zone C1 (0x80–0x9F) | **0** |
| Restes de la zone haute corrigeable | **0** (le seul `Õ` restant est le pluriel portugais) |
| « Être » / « Êtes » préservés | **23 valeurs** |
| Restes de « ætre » | **0** |
| Doublons sur `inscriptions.code` | **0** |
| Langues distinctes | **9**, toutes accentuées correctement |

## 7. Seconde moitié de BL-002

`placement_tests.determined_level` ne contenait **aucun** octet abîmé : le
problème y est différent (valeurs libres hors référentiel) et relève de la
normalisation traitée dans `docs/POINT_ENTRY_LEVEL.md`.

## 8. Points laissés ouverts

- `students` contient quelques valeurs manifestement fausses que la correction
  d'encodage rend seulement plus visibles : un prénom « À », un nom « — », des
  villes avec une espace de tête. À arbitrer avec Paula, hors BL-033.
- La fonction `public.fix_macroman(text)` est conservée en base : elle sert de
  garde-fou pour un prochain import et de trace de la correspondance appliquée.
