# Proposition — `inscriptions.entry_level` → pistes / CECRL

**Pas d’écriture en base.** Table soumise à Paula pour validation (même lot que
les noms sans accents, point 1). Déjà noté `BL-002` dans le backlog : ne pas
modifier `docs/BACKLOG.md` sur cette branche.

Référentiel cible (point 4 / certificat) :

| CECRL | Piste (UI stagiaire) |
|-------|----------------------|
| A1 | Début de parcours |
| A2 | Piste verte |
| B1 | Piste bleue |
| B2 | Piste rouge |
| C1 / C2 | Piste noire |

## Effectifs live (2026-09-14)

| Valeur actuelle (telle qu’en base) | n | Proposition CECRL | Proposition piste |
|------------------------------------|---|-------------------|-------------------|
| `NULL` | 471 | *(inchangé)* `NULL` | À déterminer |
| `Intermediaire` (sans accent) | 127 | B1 | Piste bleue |
| `Faux débutant` (octet latin1 `é` → affichage corrompu) | 81 | A2 | Piste verte |
| `Perfeccionement ` (faute + espace) | 68 | B2 | Piste rouge |
| `Débutant` (latin1 corrompu) | 61 | A1 | Début de parcours |
| `Intermédiaire` (latin1 corrompu) | 25 | B1 | Piste bleue |
| `Je n'ai jamais été évalué(e)` | 21 | `NULL` | À déterminer |
| `Débutant` (UTF-8 correct) | 14 | A1 | Début de parcours |
| `n/a` | 13 | `NULL` | À déterminer |
| `Faux débutant` (UTF-8 correct) | 11 | A2 | Piste verte |
| `Je ne connais pas mon niveau` | 4 | `NULL` | À déterminer |
| `jamais pratiqué` | 2 | `NULL` | À déterminer |
| `1 - A2` | 2 | A2 | Piste verte |
| `A1` | 1 | A1 | Début de parcours |
| Phrase entière (« Débutante ! je n'ai jamais… », « Je suis débutante en néerlandais… », « fais un stage l'an passé… ») | 3 | `NULL` | À déterminer — relire une à une |

## Règles proposées (à valider)

1. Normaliser l’encodage (latin1 `é` → UTF-8) **avant** le mapping.
2. `trim` + casse ignorée + fautes connues (`Perfeccionement` → Perfectionnement).
3. Niveaux historiques FLI : Débutant → A1, Faux débutant → A2, Intermédiaire → B1, Perfectionnement → B2.
4. Auto-positionnement / « pas évalué » / `n/a` → `NULL` (pas d’invention).
5. Phrases libres → `NULL` jusqu’à relecture Paula.
6. Ne pas écrire `entry_level` = libellé piste : le certificat porte le bilan CECRL ; la piste reste l’affichage stagiaire.

Aucune migration de données tant que cette table n’est pas validée par écrit.
