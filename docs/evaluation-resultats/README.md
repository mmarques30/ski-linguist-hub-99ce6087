# Modèles Word — résultats d’évaluation

Copies de référence des `.dotx` utilisés pour les résultats de tests.  
Process d’envoi : `docs/OPS_ENVOI_RESULTATS_EVAL.md`. Habillages PDF app : `docs/POINT_C5_PDF_HABILLAGES.md`.

## Fichiers

| Fichier | Origine | Usage ops |
|---------|---------|-----------|
| `Resultat_eval_DSF_forms.dotx` | « Résultat d'éval DSF forms.dotx » (Paula, 2026-10) | Remplir → `.docx` + PDF LibreOffice pour envoi DSF |
| `Evaluation_en_langue_vivante_saison.dotx` | « Évaluation en langue vivante saison … .dotx » | Référence mise en page / MERGEFIELD ESF ; génération PDF prod via C.5 |

## Remplir le modèle DSF

```bash
python3 scripts/fill-dsf-eval-dotx.py \
  --dotx docs/evaluation-resultats/Resultat_eval_DSF_forms.dotx \
  --out-dir /chemin/sortie
```

Le script remplace les MERGEFIELD (y compris champs complexes Word) et le pied de page
(`Version du JJ/MM/AAAA`, plus « Version 1 du … »).

Champs spéciaux gérés hors MERGEFIELD document :

- `title_year` — année dans le titre du document  
- `footer_version` — texte exact du pied (ex. `Version du 13/10/2026`)

### MERGEFIELD — `Resultat_eval_DSF_forms.dotx`

| Champ | Contenu typique |
|-------|-----------------|
| `Prénom__NOM__du_candidat` | Steven Mandica |
| `École_de_ski` | Entreprise / site (ex. Téléphérique du Salève) |
| `Langue_évaluée` | Anglais |
| `Date_de_lévaluation` | 08/10/2026 |
| `Évaluateurrice` | C. Mollard |
| `Compréhension` | `3,5 - B2+` |
| `Expression` | idem |
| `Structures_de_la_langue` | idem |
| `Expression_Technique_et_spécifique` | idem |
| `Conversation_Générale` | idem |
| `Appréciation_générale_moyenne` | idem |
| `Introduction` | Bloc commentaires |
| `Autres_commentaires_introduction` | |
| `Grammaire` | |
| `Points_de_grammaire_à_travailler` | |
| `Expression_Technique` | |
| `Partie_Technique` | |
| `Autres_commentaires` | |
| `Exemples` | |
| `Appréciation` | |
| `Autres_commentaires1` | |
| `Conclusion` | |

### MERGEFIELD — `Evaluation_en_langue_vivante_saison.dotx`

Même famille de champs, plus `Carte_syndicale_` ; pas de champ `Expression_Technique` isolé
(présent côté DSF). Le PDF envoyé aux candidats ESF reste celui généré par l’app (C.5).

## Tableau des niveaux (session DSF)

Pour une grosse session : document Word/CSV colonnes  
Nom · Entreprise · Langue · 5 compétences · Niveau final · CECRL.  
Exemple de génération : `scripts/prepare-dsf-mandica-word.py` (`build_levels_table`).
