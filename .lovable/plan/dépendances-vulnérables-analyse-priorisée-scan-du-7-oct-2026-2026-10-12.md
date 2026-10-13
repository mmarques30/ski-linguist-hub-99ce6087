# Dépendances vulnérables — analyse priorisée (scan du 7 oct. 2026), aucun correctif appliqué

Source : scan des dépendances de production du 7 oct. 2026. Il compte 47 lignes d'alerte ; l'écran Security en regroupe une partie, d'où ses 43 issues. Toutes ces alertes viennent de 5 paquets directs.

| Prio | Paquet (version actuelle) | Failles (nb) | Version cible | Risque de casse FLI |
|---|---|---|---|---|
| 1 Critique | jspdf 4.0.0 | 1 critique (injection HTML dans une nouvelle fenêtre), 6 graves (injection PDF/JS via AcroForm, addJS et la couleur FreeText ; blocage via des GIF/BMP piégés), 2 modérées (métadonnées XMP, addJS), et via ses composants internes dompurify (13 XSS) et fflate (1) | dernière 4.x (> 4.2.0) | Faible : même version majeure 4. À vérifier : PDF évaluations (C.5 habillages), certificat, émargement, fiches de présence, et la copie Deno côté serveur si elle utilise jspdf |
| 2 Grave | exceljs 4.4.0 | 9 graves (blocages via brace-expansion et minimatch ; injection de commande via la commande glob, inutilisée par l'app), 3 modérées (brace-expansion, uuid) | Aucune version exceljs corrigée : forcer brace-expansion ≥ 1.1.21, minimatch ≥ 9.0.7, glob ≥ 10.5.0 et uuid ≥ 11.1.1 via `overrides` / `resolutions` | Faible : ces composants ne servent pas à l'export DSF. À vérifier : un export XLSX DSF |
| 3 Grave | react-router-dom 6.30.1 | 1 grave (XSS via redirection ouverte), 5 modérées (redirections `//` et `\`, injection SSR) | 6.30.4 ou plus (dernière 6.x) | Faible en 6.x. Passer en 7.x pour corriger les 2 dernières failles casserait l'app (migration). Ces 2 failles concernent le SSR et des liens piégés, donc risque faible pour FLI : rester en 6.x |
| 4 Grave | recharts 2.15.4 (via lodash) | 1 grave (injection de code via `_.template`), 2 modérées (pollution de prototype) | Forcer lodash ≥ 4.17.24 (override) ; ne pas passer à recharts 3 | Nul avec l'override. Passer à recharts 3.x (version majeure) casserait les graphiques du tableau de bord |
| 5 Grave | @supabase/supabase-js 2.90.1 (via ws) | 1 grave (blocage mémoire), 1 modérée (fuite mémoire) | Dernière 2.x, ou forcer ws ≥ 8.21.0 | Nul : ws ne sert que côté Node, pas dans le navigateur |

## Ordre de correction recommandé (une fois approuvé)
1. Mettre à jour jspdf vers la dernière 4.x, puis tester tous les PDF.
2. Ajouter des `overrides` pour lodash, brace-expansion, minimatch, glob, uuid, ws et dompurify.
3. Mettre à jour react-router-dom vers la dernière 6.x.
4. Relancer le scan des dépendances.

À noter : ce scan ne regarde que `bun.lock`. Le projet utilise npm (`package-lock.json`), donc il faut mettre à jour les deux fichiers de verrouillage.
