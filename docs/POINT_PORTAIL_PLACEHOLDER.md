# Garde-fous e-mail et portail (avant RESEND_API_KEY)

Branche séparée de C.4. Aucune donnée personnelle.

## Bloquant — invitations portail

- Carte `/students` « Invitations portail stagiaire » **masquée** tant que
  `STUDENT_PORTAL_IN_SEASON_SCOPE` vaut `false` (`src/lib/email-guards.ts`).
- Toute adresse `@fli.placeholder` est refusée, tous modules
  (`isFliPlaceholderEmail`, constante unique testée).
- Un envoi vers plus d'un destinataire exige `confirmedCount` égal au nombre
  (dialogue « Confirmer l'envoi de masse » avec compteur).

La fonction Edge `invite-student-portal` n'est pas redéployée ici ; le fichier
est prêt. Le client refuse déjà la masse sans confirmation.

## Gênant — `/admin/testing`

Boutons **Exporter** / **Réinitialiser la checklist** (plus de rouge), checklist
en français, carte de nettoyage ZZTEST sous un séparateur.
