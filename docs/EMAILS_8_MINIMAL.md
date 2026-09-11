# Point 8-minimal — Emails transactionnels

Date : 2026-09-11
Migration : `supabase/migrations/20260911090000_emails_8_minimal.sql`
**Aucun cron n'est activé.** `RESEND_API_KEY` n'est pas dans le dépôt.

---

## 1. À créer chez Resend (vous)

1. Compte Resend : [https://resend.com/signup](https://resend.com/signup) avec `info@fli.fr`.
2. Domaines → **Add domain** : `fli.fr` (pas `send.fli.fr` comme domaine From). Région recommandée : **eu-west-1**. Return-path : sous-domaine `send` (valeur par défaut).
3. Clé API : API Keys → Create (`Sending access`). Nom : `fli-formation-prod`.
4. Coller la clé dans les **secrets des Edge Functions** Supabase / Lovable, nom exact : `RESEND_API_KEY`. Une minute après, le bouton « Envoyer les deux tests » de `/admin/testing` part réellement.

Ne jamais committer la clé.

## 2. Enregistrements DNS à poser chez l'hébergeur

Hébergeur actuel de `fli.fr` : **IONOS (1&1)**, serveurs `ns1118.ui-dns.*`.
Console : IONOS → Domaines → fli.fr → DNS.

### Ne pas modifier (messagerie Outlook existante)

| Type | Nom / hôte | Valeur actuelle | Pourquoi |
|---|---|---|---|
| MX | `@` (apex) | `0 fli-fr.mail.protection.outlook.com` | Réception `info@fli.fr` |
| TXT | `@` | `v=spf1 include:spf.protection.outlook.com -all` | SPF Outlook. **Ne pas y ajouter Resend** (limite des 10 lookups). |
| TXT | `_dmarc` | `v=DMARC1; p=none;` | DMARC déjà présent, politique d'observation |

### À créer — copier les valeurs **exactes** du tableau Resend (Domains → fli.fr)

Resend affiche le jeu définitif après l'ajout du domaine. Selon la date de création du domaine, le tableau est soit **classique (TXT + MX)**, soit **CNAME** (domaines créés après août 2026). Poser **exactement** ce que Resend affiche.

Forme classique (la plus fréquente pour un From `@fli.fr` avec return-path `send`) :

| Type | Nom / hôte chez IONOS | Valeur (forme) | Rôle |
|---|---|---|---|
| TXT | `resend._domainkey` | chaîne `p=...` **unique**, copiée depuis Resend (ne pas la taper) | DKIM |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF du chemin de retour, isolé de l'apex Outlook |
| MX | `send` | priorité `10`, hôte `feedback-smtp.eu-west-1.amazonses.com` (ou la valeur régionale affichée) | Retours / bounces Resend |

Forme CNAME (si le tableau Resend affiche 2 ou 3 CNAME au lieu du couple TXT+MX) : poser chaque CNAME tel quel, hôte et cible copiés depuis Resend. Ne pas inventer les cibles.

TTL : laisser la valeur IONOS par défaut.

Ensuite, dans Resend : « I've added the records ». La propagation IONOS est en général de quelques minutes, parfois jusqu'à 24 h.

## 3. Identité d'envoi (déjà dans le code)

| Champ | Valeur |
|---|---|
| From (affichage) | `FLI — France Langues International` |
| From (adresse) | `noreply@fli.fr` |
| Reply-To | `info@fli.fr` |

## 4. Les deux textes (avant activation)

Voir aussi l'aperçu dans `/admin/testing`.

### Confirmation d'inscription — déclenchée par `/register`

**Sujet :** Confirmation de votre inscription — France Langues International

Bonjour {{student_name}},

Nous vous confirmons votre inscription à la formation **{{language}}**, du {{start_date}} au {{end_date}}.

Votre code d'inscription : **{{inscription_code}}**

Nous reviendrons vers vous pour la suite du parcours (horaires, formateur·rice, accès à l'espace stagiaire).

Si vous avez une question, répondez à ce message : il arrivera à info@fli.fr.

Cordialement,

FLI — France Langues International
25 avenue de la Gare
73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr

### Invitation à l'espace stagiaire — lien magique

**Sujet :** Accès à votre espace stagiaire — France Langues International

Bonjour {{student_name}},

Votre espace stagiaire est prêt. Cliquez sur le lien ci-dessous pour vous y connecter. Ce lien est personnel, à usage unique, et expire après un délai court.

[Accéder à mon espace stagiaire]({{magic_link}})

Si vous n'êtes pas à l'origine de cette demande, ignorez ce message. Aucun accès ne sera ouvert sans votre action.

Pour toute question, répondez à ce message : il arrivera à info@fli.fr.

Cordialement, *(même pied de page)*

## 5. Envoi de test

Bouton `/admin/testing` → « Envoyer les deux tests à info@fli.fr ».

- Sans clé : HTTP 409, message explicite, **aucun** appel Resend.
- Avec clé : deux messages préfixés `[TEST]`, destinataire `info@fli.fr`, corps fictif `ZZTEST Camille`.

## 6. J-10 — sujet portugais

Ancien : `FLI — Validação de horários (D-10) — {{total_count}} inscrição(ões)`
Corrigé : `FLI — Validação dos horários (J-10) — {{total_count}} inscrição(ões)`

Le cron `process-schedule-reminders` n'est **pas** activé.

## 7. Retour (down)

```sql
-- Les deux nouveaux / mis à jour restent utilisables ; pour retirer l'invitation :
DELETE FROM public.email_templates WHERE slug = 'student_portal_invite';
```

Les fonctions `submit-registration` et `invite-student-portal` retombent sur un HTML de repli si le modèle manque.
