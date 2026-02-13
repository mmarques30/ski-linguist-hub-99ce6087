

# Remplacer le PeriodSelector "sub-tabs" par un filtre compact

## Probleme
Le composant `PeriodSelector` affiche 6 boutons horizontaux ("Ce mois", "Mois dernier", "Cette saison", etc.) qui ressemblent a des sous-onglets de navigation. Ce composant est repete identiquement sur 3 pages: Dashboard, Analyses, et Rentabilite. Il faut le transformer en un filtre compact (dropdown/select) qui ne ressemble plus a des onglets.

## Solution
Remplacer les 6 boutons par un **Select dropdown** compact avec les memes options, accompagne de la plage de dates affichee. Le calendrier personnalise reste accessible via l'option "Personnalise".

### Avant (boutons horizontaux)
```text
[Ce mois] [Mois dernier] [Cette saison] [Saison derniere] [Cette annee] [Personnalise]  31 janv. 2026 - 27 fevr. 2026
```

### Apres (dropdown compact)
```text
[v Ce mois]  31 janv. 2026 - 27 fevr. 2026
```

## Fichier modifie

### `src/components/finance/PeriodSelector.tsx`
- Remplacer les 6 `Button` par un composant `Select` (de `@/components/ui/select`)
- Le `Select` affiche la periode selectionnee avec une icone calendrier
- Les `SelectItem` contiennent les 6 options (Ce mois, Mois dernier, etc.)
- Quand "Personnalise" est selectionne, le Popover avec les 2 calendriers s'ouvre
- La plage de dates reste affichee a droite du select
- Style compact: le select prend juste la largeur necessaire

### Pages inchangees
Les 3 pages (Dashboard, Analyses, Rentabilite) ne necessitent aucune modification car elles utilisent toutes le meme composant `PeriodSelector`. Le changement dans le composant se propage automatiquement.

## Detail technique
- Import `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` de `@/components/ui/select`
- Le `SelectTrigger` aura une largeur `w-auto` avec icone `CalendarIcon`
- Le `onValueChange` du Select appelle `handlePeriodChange` comme avant
- Le Popover pour les dates personnalisees reste identique

