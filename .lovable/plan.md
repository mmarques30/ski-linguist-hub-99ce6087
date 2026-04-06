

# Fix "Inscriptions récentes" - statuts obsolètes et doublons

## Problème
Le composant `RecentInscriptions` appelle `useInscriptions()` sans filtre, qui retourne toutes les inscriptions triées par `created_at`. Résultat : statuts potentiellement stale (la vue `inscriptions_complete` a bien les bons statuts, mais le tri par `created_at` montre les plus anciennes en premier) et doublons par stagiaire.

## Solution

### Fichier modifié : `src/hooks/useInscriptions.ts`
- Ajouter une nouvelle fonction `useRecentInscriptions()` dédiée au dashboard
- Requête sur `inscriptions_complete` ordonnée par `updated_at DESC`
- Limite à 20 résultats côté DB (marge pour la déduplication client)

### Fichier modifié : `src/components/dashboard/RecentInscriptions.tsx`
- Remplacer `useInscriptions()` par `useRecentInscriptions()`
- Après réception des données, dédupliquer par `student_id` : pour chaque stagiaire, ne garder que l'inscription avec le `updated_at` le plus récent
- Limiter à 5 résultats après déduplication

### Logique de déduplication (côté client)
```typescript
const seen = new Map();
for (const insc of data) {
  if (!seen.has(insc.student_id)) {
    seen.set(insc.student_id, insc);
  }
}
// Les données sont déjà triées par updated_at DESC, donc le premier vu est le plus récent
const unique = Array.from(seen.values()).slice(0, 5);
```

### Pourquoi pas uniquement côté SQL ?
La vue `inscriptions_complete` est un simple SELECT avec JOINs. Le `DISTINCT ON` n'est pas disponible via l'API Supabase JS. La déduplication client sur 20 lignes est triviale.

## Résumé
- 2 fichiers modifiés
- Tri par `updated_at` au lieu de `created_at`
- Déduplication par stagiaire (1 ligne max par personne)
- Statuts toujours à jour (la vue lit directement la table)

