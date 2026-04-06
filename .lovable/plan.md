

# Fix: Afficher le nom admin et indicateur profil incomplet

## Probleme
Le `full_name` dans la table `profiles` est vide pour le premier admin (cree via seed/migration). Le composant affiche "—" au lieu du nom ou de l'email.

## Solution

### 1. `src/hooks/useUserManagement.ts`
- Ajouter un champ `has_complete_profile` au type `UserWithRole`
- Dans le mapping des profils, utiliser `full_name || email` comme nom affiche
- Calculer `has_complete_profile: !!p.full_name && p.full_name.trim() !== ""`

### 2. `src/pages/admin/UserManagement.tsx`
- Remplacer `{u.full_name || "—"}` par `{u.full_name || u.email}`
- Quand `has_complete_profile === false`, ajouter un petit badge orange/grise "Profil incomplet" a cote du nom pour inciter a completer les infos

Deux fichiers modifies, zero impact sur les autres fonctionnalites.

