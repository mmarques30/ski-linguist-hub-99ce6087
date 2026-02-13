

# Corriger la lisibilite du graphique "Repartition des impayes"

## Probleme
Le graphique PieChart sur la page Charges Fixes a des labels qui se chevauchent et sont coupes car:
1. `labelLine={false}` force les labels directement sur les segments, ce qui provoque des superpositions
2. Le conteneur (250px de hauteur) est trop petit pour afficher tous les labels
3. Seulement 4 couleurs definies (`CHART_COLORS`) pour potentiellement 10 types de couts, ce qui rend les categories difficiles a distinguer

## Solution

### Fichier: `src/pages/finance/FinanceChargesFixes.tsx`

**1. Ajouter plus de couleurs**
- Etendre `CHART_COLORS` de 4 a 10 couleurs distinctes pour couvrir tous les types de couts

**2. Remplacer les labels du Pie par une legende externe**
- Retirer le `label` custom du composant `<Pie>` (qui cause les superpositions)
- Ajouter une legende en dessous du graphique sous forme de liste avec pastilles de couleur + nom + pourcentage + valeur
- Augmenter la hauteur du conteneur de 250px a 300px

**3. Structure du nouveau rendu**
```
[    Donut Chart (sans labels)    ]
[  Legende: pastille + nom + %   ]
```

La legende sera une grille 2 colonnes sous le donut, chaque item montrant:
- Pastille de couleur
- Nom de la categorie
- Pourcentage
- Valeur en EUR

Cela garantit que toutes les categories sont lisibles independamment de la taille des segments.

