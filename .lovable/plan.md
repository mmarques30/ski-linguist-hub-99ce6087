

# Fix KPI "Formations Actives" - logique et affichage

## Probleme
La requete filtre `status = "En cours"` puis cherche `status = "Facturé"` parmi les resultats — ce qui retourne toujours 0 (contradiction logique).

## Corrections

### 1. `src/hooks/useDashboardStats.ts`
- Modifier la requete active inscriptions pour aussi selectionner `instructor_id`
- Changer le calcul de `validated`: compter les inscriptions "En cours" qui ont un `instructor_id` non null (= formateur assigne = formation confirmee)

### 2. `src/components/dashboard/DashboardGestao.tsx`
- Ajouter des traductions pour "Aucune formation en cours" (FR/PT-BR/EN)
- Remplacer le sous-texte du KPI :
  - Si `total === 0` : afficher "Aucune formation en cours"
  - Sinon : afficher `{validated} confirmées` (au lieu de "validées")

### 3. Traductions ajoutees
| Cle | FR | PT-BR | EN |
|---|---|---|---|
| noActiveClasses | Aucune formation en cours | Nenhuma turma ativa | No active classes |
| confirmedClasses | confirmées | confirmadas | confirmed |

Deux fichiers modifies, zero impact sur les autres KPIs.

