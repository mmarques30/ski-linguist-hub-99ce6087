

# Refonte UI du Dashboard Financier

## Objectif
Redesigner le dashboard financier (`/finance`) pour adopter le style visuel du composant de reference 21st.dev, en utilisant les couleurs de la marque FLI (Gold #FCA311, Navy #14213D, Gray #E5E5E5, Black #000000, White #FFFFFF). Sans emojis ni icones superflus.

## Fichiers a modifier

### 1. `src/components/finance/FinanceKPICard.tsx` -- Refonte complete
- Remplacer les variantes colorees (emerald, amber, red, blue) par un design monochrome elegant utilisant les couleurs de la marque
- Ajouter indicateur de tendance (fleche + pourcentage) avec couleur verte/rouge pour positif/negatif
- Layout: valeur en grand, titre discret au-dessus, description en bas avec badge de tendance
- Bordure gauche en couleur Gold (#FCA311) ou Navy (#14213D) selon l'importance
- Supprimer les icones des KPI cards (design epure)

### 2. `src/pages/finance/FinanceDashboard.tsx` -- Restructuration majeure
- **KPI Cards**: 4 cards en ligne avec le nouveau design (CA Facture, Encaisse, A payer formateurs, Marge brute)
- **Section "Receitas vs Despesas"**: Nouveau graphique en barres horizontales comparant revenus et depenses mois par mois, avec barres Gold (revenus) et Navy (depenses), legend integree
- **Pie Chart "Repartition par activite"**: Couleurs de la palette marque (Gold, Navy, Gray, Black) au lieu de hsl(var(--chart-x))
- **Section "Metas du Trimestre"**: Ajout de barres de progression pour objectifs trimestriels (CA, nb inscriptions, marge cible) avec la couleur Gold
- **Suppression du bouton "Ajouter un cout"** du header (disponible dans Rentabilite)
- **Graphique CA Evolution**: Ligne Gold pour CA N, ligne Navy pointillee pour CA N-1
- **Tooltip / Legend**: Style epure, fond blanc, texte Navy

### 3. `src/index.css` -- Ajout de variables chart
- Ajouter `--chart-1` a `--chart-5` mappes sur les couleurs de la marque:
  - chart-1: Gold (#FCA311)
  - chart-2: Navy (#14213D)
  - chart-3: Gray (#E5E5E5)
  - chart-4: Black (#000000)
  - chart-5: White (#FFFFFF)

### 4. `src/pages/finance/FinanceChargesFixes.tsx` -- Harmonisation couleurs
- Remplacer les couleurs emerald/amber/red par les couleurs de la marque (Gold pour accents, Navy pour textes importants)
- Barres de progression en Gold au lieu de emerald
- Pie chart avec palette marque

### 5. `src/pages/finance/FinanceRentabilite.tsx` -- Harmonisation couleurs
- Badges de marge: Gold pour "Excellent", Navy pour "Correct", destructive pour "Faible"
- KPI summary cards avec bordure Gold

### 6. `src/pages/finance/FinanceTresorerie.tsx` -- Harmonisation couleurs
- Badges de solde cumulatif en Gold (positif) / destructive (negatif)
- Couleurs des lignes Entrees/Sorties: Gold et Navy

### 7. `src/pages/finance/FinanceAnalyses.tsx` -- Harmonisation couleurs
- Evolution positive en Gold au lieu de emerald
- Totaux en Navy

## Palette de couleurs appliquee

| Element | Couleur | Code |
|---------|---------|------|
| Revenus, accents positifs | Gold | #FCA311 |
| Textes importants, barres secondaires | Navy | #14213D |
| Fond neutre, separateurs | Gray | #E5E5E5 |
| Texte principal | Black | #000000 |
| Fond cards | White | #FFFFFF |
| Negatif / danger | Destructive (rouge existant) | -- |

## Points importants
- Aucun emoji dans l'interface
- Icones uniquement fonctionnels (pas decoratifs)
- Design clean et professionnel
- Toutes les pages Finance coherentes visuellement
- Graphiques recharts avec couleurs de la marque exclusivement

