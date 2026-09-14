# Codes d'inscription FLI-AAnnnn

Migration : `supabase/migrations/20260914160000_inscription_code_sequence.sql`

Journal : `inscription_code_fix`, `inscription_code_trial_cleanup` (codes et uuid, aucune donnée personnelle)

## Cause

`generate_inscription_code` lisait `SUBSTRING(code FROM 5 FOR 4)`. Le format est
`FLI-` + année (2) + séquence (4) : la séquence commence au 7e caractère.
Les essais `FLI-260001`, `FLI-262601`, `FLI-262627` faisaient proposer
`FLI-262627` en boucle (409 unicité). Plus aucune inscription ne pouvait être créée.

## Correction

- Séquence = `RIGHT(code, 4)` sur les seuls codes `^FLI-AA[0-9]{4}$`
- Séquence Postgres `inscription_code_YY` + boucle tant que le code existe
- Trigger `set_inscription_code` si `code` est vide
- `submit-registration` : message Postgres renvoyé (plus « Erreur interne » / « non-2xx » sur les erreurs Supabase) ; stagiaire créé dans cette requête supprimé si l'inscription échoue
- Trois inscriptions d'essai hors ZZTEST supprimées, puis stagiaires devenus orphelins

## Documents étape 7

Liens (nouvel onglet) vers :

- `/registration-documents/reglement-interieur.pdf`
- `/registration-documents/conditions-generales.pdf`

Ces deux fichiers n'étaient **pas** dans `public/registration-documents/` (seulement le pack
moniteur). Les déposer sous ces noms exacts pour que les liens ouvrent un document.

## Vérifications

1. `generate_inscription_code()` propose un code libre au format `FLI-AAnnnn`
2. Deux créations consécutives → deux codes, séquence +1
3. Échec volontaire : pas de stagiaire orphelin ; message en français
4. `/register` étape 7 : liens règlement intérieur + conditions générales (nouvel onglet)

## DOWN

Voir le bas de la migration. Ne pas exécuter sans validation Paula.
Ne recrée pas les trois inscriptions d'essai.

C.6 n'est pas commencé. Gabarits PDF C.5 non modifiés.
Les garde-fous emails (#26) n'ont rien à changer ici ; la fonction Edge concernée
attend toujours le déploiement Paula.
