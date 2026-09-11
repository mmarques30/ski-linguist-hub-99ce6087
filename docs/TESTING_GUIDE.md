# Guide de test — FLI Formation

Scénario à jouer **à partir du lundi 14 septembre 2026**. Compte administrateur requis pour les étapes back-office. Le formulaire public `/register` et la connexion stagiaire par lien magique n’en ont pas besoin.

La checklist à cocher dans l’application reste sur `/admin/testing` (sidebar **Tests QA**). Les deux cartes en haut de cette page (emails 8-minimal, nettoyage ZZTEST) font partie de ce kit.

---

## Convention des jeux de test

Tout enregistrement de test porte **les deux** marques suivantes :

| Champ | Valeur |
|---|---|
| Nom ou prénom | commence par `ZZTEST` (ex. prénom `ZZTEST`, nom `Camille`) |
| Email | se termine par `@example.invalid` (ex. `zztest.camille@example.invalid`) |

Sans le préfixe **et** sans ce domaine, le bouton de nettoyage **ne touche pas** la ligne. N’utilisez jamais un vrai nom ni une vraie adresse.

Jeu recommandé pour ce scénario :

- Civilité : Madame
- Prénom : `ZZTEST`
- Nom : `Camille`
- Email : `zztest.camille@example.invalid`
- Téléphone : `0000000000`
- Adresse : `1 rue de Test`, `00000`, `Testville`

`@example.invalid` ne reçoit **aucun** courrier (domaine réservé, non routable). La preuve d’envoi se lit dans le journal d’emails de la fiche, et les deux textes se relisent / se testent vers `info@fli.fr` depuis `/admin/testing`.

En fin de campagne de test : `/admin/testing` → **Simuler (dry-run)** → si les comptes sont justes, taper `NETTOYER` → **Nettoyer les données de test**.

---

## Avant de commencer

1. Fusionner et déployer les branches `cursor/emails-8-minimal-7435` puis `cursor/kit-test-zztest-7435` (ou la seconde, qui contient déjà la première).
2. Poser `RESEND_API_KEY` seulement après le DNS du point 8-minimal (voir `docs/EMAILS_8_MINIMAL.md`). Tant que la clé n’est pas là, `/register` enregistre quand même l’inscription ; l’écran de confirmation dira que l’équipe recontactera, et le journal d’emails restera vide ou en erreur « clé absente ».
3. Ne pas activer de cron.

---

## Scénario pas à pas

### 1. Inscription via `/register`

1. Déconnexion back-office (ou navigateur privé).
2. Ouvrir `/register`.
3. **Étape 1 — Lieu et formation.** Choisir une langue, un lieu, une durée du catalogue. Noter les dates proposées. Si aucune session ne commence dans les **10 jours**, on corrigera la date au § 5.
4. **Étape 2 — Informations personnelles.** Saisir le jeu ZZTEST ci-dessus. Continuer.
5. **Étape 3 — Profil professionnel.** Choisir un profil **autre** que moniteur de ski (évite le pack documents moniteur). Continuer.
6. **Étape 4 — Test de niveau.** Le test est obligatoire. Répondre jusqu’à la fin. À l’écran : un résultat en **piste** (pas un niveau CECRL). Continuer.
7. **Étape 5 — Attentes.** Remplir librement, certification au choix (ex. Sans certification). Continuer.
8. **Étape 6 — Paiement.** Choisir **150 € par virement bancaire + solde par chèque à l’inscription** (pas Stripe : pas de carte). Relire IBAN FLI à l’écran. Continuer.
9. **Étape 7 — Confirmation.** Cocher l’acceptation, cliquer pour envoyer.

**À l’écran :** cercle vert, titre **Inscription enregistrée**, badge **Code : FLI-…**. Conserver ce code.

- Clé Resend absente : texte du type « Notre équipe vous contactera prochainement. »
- Clé présente : « Un email de confirmation vous a été envoyé. » L’envoi part vers `@example.invalid` (il n’arrive nulle part). Les textes réels se vérifient au § 2.

Bloc virement : RIB FLI + rappel du solde par chèque.

---

### 2. Réception de l’email de confirmation

Deux lectures distinctes.

**A. Journal de l’inscription (toujours)**

1. Se connecter au back-office (`/auth`).
2. `/inscriptions`, rechercher `ZZTEST` ou le code FLI.
3. Ouvrir la fiche → onglet **Accès client**.
4. Bloc **Emails envoyés** : une ligne **Confirmation d’inscription**, destinataire `zztest.camille@example.invalid`.
   - Sans clé : statut d’échec, message du type clé absente.
   - Avec clé : statut `sent` (l’adresse de test ne livrera pas le message).

**B. Textes réels dans la boîte FLI (une fois la clé posée)**

1. `/admin/testing`, carte **Emails 8-minimal**.
2. Relire les deux aperçus (vouvoiement, `formateur·rice`, adresse 25 avenue de la Gare, 73800 Montmélian, 04 79 28 21 09, info@fli.fr).
3. **Envoyer les deux tests à info@fli.fr**.
4. Dans `info@fli.fr` : deux messages préfixés `[TEST]`, expéditeur affiché **FLI — France Langues International**, répondre ouvre un brouillon vers `info@fli.fr`.

Sans clé, le bouton répond que la clé est absente ; **rien ne part**.

---

### 3. Invitation au portail (lien magique)

1. `/students`, ouvrir **ZZTEST Camille**.
2. Carte **Espace stagiaire** : badge **Compte non créé**, bouton **Envoyer l’invitation**.
3. Toast **Invitation portail envoyée par email**.
4. Recharger : badge **Compte lié**.
5. Onglet **Accès client** de l’inscription : une ligne d’email d’invitation (même logique clé présente / absente qu’au § 2).
6. Le lien magique part vers `@example.invalid` : vous ne pouvez pas cliquer depuis cette boîte. Pour voir l’espace : **Voir comme le stagiaire** (`/students/…/portal-preview`). Bandeau ambre **Mode prévisualisation admin**.

Quand la clé Resend est posée, le second email de test du § 2 B est le texte d’invitation (lien d’exemple, pas un vrai jeton).

---

### 4. Affectation formateur·rice

1. Fiche inscription ZZTEST → **Modifier**.
2. Champ **Formateur** : choisir une personne **déjà en base** (ne pas créer un formateur ZZTEST).
3. Enregistrer.
4. Sur la fiche : le nom du formateur·rice apparaît dans les infos générales / formation.

---

### 5. Validation J-10

La liste `/inscriptions/schedule-validation` ne montre que les inscriptions **en attente d’horaire**, non annulées, dont la **date de début est aujourd’hui ou dans les 10 jours**.

1. Si la session catalogue est plus loin : **Modifier** l’inscription, passer **date de début** à une date dans cette fenêtre (ex. test le 14/09 → début le 18/09/2026) et une date de fin cohérente. Enregistrer. Le statut d’horaire doit rester `pending`.
2. Sidebar **Horaires J-10** (`/inscriptions/schedule-validation`).
3. **À l’écran :** titre **Validation horaires J-10**, groupe par langue et date de début, ligne **ZZTEST Camille** avec le code FLI.
4. Cocher la ligne, **Valider matin** ou **Valider après-midi**.
5. Toast du type « 1 inscription(s) — groupe … validé ». La ligne disparaît de la liste.
6. Retour fiche : bouton **Horaire** → statut matin ou après-midi renseigné.

Aucun cron de relance J-10 n’est activé ; cette étape est manuelle.

---

### 6. Formulaires d’entrée et de sortie

Sur la fiche, onglet **Formation**, carte **Bilan de progression**.

**Entrée**

1. **Formulaire entrée**. Titre : **Formulaire d’entrée formateur**.
2. Niveau général (entrée) : ex. `Piste bleue` (piste / constat, pas SNMSF).
3. Niveau technique / métier : ex. `Vocabulaire accueil`.
4. Remarques facultatives. Enregistrer.
5. Tableau : colonne Entrée remplie. Mention **Entrée OK**.

**Sortie**

1. **Formulaire sortie**. Titre : **Formulaire de sortie formateur**.
2. Niveau général (sortie CECRL) : ex. `B1`.
3. Niveau technique (sortie CECRL) : ex. `B1`.
4. Objectif pédagogique atteint : **Oui**.
5. Commentaire formateur : deux ou trois phrases.
6. Heures suivies : laisser la valeur prévue ou saisir le prévu.
7. Enregistrer.
8. Tableau : colonnes Sortie remplies, **Sortie OK**, objectif **Oui**, commentaire visible. Aucune mention SNMSF / DSF.

---

### 7. Pack de fin

1. En-tête de fiche → **Pack Fin de Formation**.
2. **À l’écran :** titre **Pack Fin de Formation**, nom ZZTEST, code FLI, cases Facture / Certificat / Enquête cochées, bilan Entrée / Sortie repris. Si le formulaire de sortie manque, le certificat est bloqué (revenir au § 6).
3. Générer.
4. Succès : **Certificat créé (bilan de progression)**, identifiant de facture, éventuellement jeton d’enquête.
5. Statut de l’inscription : **Terminée**.

---

### 8. Certificat visible dans le portail

1. Fiche stagiaire → **Voir comme le stagiaire** → onglet **Documents**.
2. **À l’écran :** **Certificat de fin de formation**, date de délivrance du jour.
3. Pour le rendu stagiaire réel (lien magique) : `/student/documents`, carte **Certificats**, texte **Bilan de progression Entrée / Sortie**, bouton **Télécharger**. Le PDF s’ouvre via une URL signée (bucket privé). Le PDF montre Entrée / Sortie, pas une piste comme niveau final, et le paragraphe sur l’évaluation SNMSF en bas.

Sans lien magique, la prévisualisation admin suffit pour cette étape.

---

### 9. Facture et paiement par chèque

1. `/invoices`. Rechercher le n° créé par le pack (format `{exercice}.{séquence}`) ou le nom **ZZTEST Camille**.
2. Crayon : **Méthode de paiement** = **Chèque**. Notes internes : `ZZTEST chèque n° 000001`. Enregistrer.
3. Icône avion (facture en brouillon) → badge **Envoyée**. Toast **Facture marquée comme envoyée**.
4. Icône coche verte → badge **Payée**. Toast **Facture marquée comme payée**.
5. Optionnel, pour un encaissement listé à part : `/finance/payments` → **Enregistrer un paiement** → montant TTC de la facture, méthode **Chèque**, statut **Reçu**, payeur `ZZTEST Camille`, référence `ZZTEST-CHQ-000001`. Le paiement apparaît dans le tableau avec le libellé **Chèque**.

Ne pas exporter de CSV nominatif dans le dépôt.

---

### 10. Nettoyage

1. `/admin/testing` → **Nettoyer les données de test**.
2. **Simuler (dry-run)** : journal avec des comptes > 0 (stagiaires, inscriptions, factures, paiements, certificats, éventuellement fichiers et comptes). **Dernier n° de facture réel** = plus haut numéro hors ZZTEST (plancher 14297). **Prochaine séquence** = ce numéro + 1.
3. Taper `NETTOYER` → **Nettoyer les données de test**.
4. `/students` : plus de ZZTEST. `/invoices` : plus de facture ZZTEST. Une nouvelle facture réelle reprend la séquence affichée.
5. Une seconde simulation doit afficher des zéros.

---

## Ce que ce guide ne couvre pas

- Évaluations SNMSF / DSF (point C, après validation de ce kit).
- Prospection moniteurs (gelée).
- Relances facture automatiques (cron existant, hors scénario).
- Paiement Stripe de `/register` (volontairement évité ici).
