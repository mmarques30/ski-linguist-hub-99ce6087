# FLI — Nouvelle landing page institutionnelle
### Spec technique pour implémentation dans Cursor
Référence visuelle : [Empregga — Site institutionnel (Behance)](https://www.behance.net/gallery/239766373/Site-Institucional-Empregga)
Source du contenu : [stages-langues.fr](https://www.stages-langues.fr) (site actuel de FLI)
Dépôt cible : `ski-linguist-hub` (mmarques30/ski-linguist-hub-99ce6087) — React + TypeScript + Tailwind + Supabase (Lovable)

---

## 1. Objectif

Aujourd'hui, `plateforme.fli.fr` ouvre directement sur `/auth`. On inverse la logique : la racine du domaine sert une landing page institutionnelle, et l'accès au système (connexion) devient une action délibérée via un bouton du menu.

**Changement de routes :**
- `plateforme.fli.fr/` → nouvelle LP institutionnelle (cette spec)
- `plateforme.fli.fr/auth` → écran de connexion actuel, inchangé
- `plateforme.fli.fr/app` → tableau de bord staff (anciennement `/`)
- Bouton « Accès FLI » dans le header de la LP → route `/auth`

Ce n'est pas un site séparé : c'est une nouvelle route dans le même projet, qui réutilise la stack déjà en production.

---

## 2. Structure générale (sitemap une page + FAQ)

```
Header fixe (logo + menu + CTA « Accès FLI »)
├── #accueil        → Bloc 1 : Hero
├── #methode        → Bloc 2 : Vidéo institutionnelle
├── #partenaires    → Bloc 3 : Carrousel de logos (entre bloc 2 et bloc 4)
├── #formations     → Bloc 4 : Formations / différenciateurs
Footer
├── #faq            → Bloc 5 : FAQ (après le footer, hors du flux principal)
```

Menu du header (défilement doux vers chaque ancre, sauf le CTA) :

| Libellé du menu | Ancre | Bloc |
|---|---|---|
| Logo FLI | haut de page (`#accueil`) | — |
| Notre méthode | `#methode` | Bloc 2 |
| Partenaires | `#partenaires` | Bloc 3 |
| Formations | `#formations` | Bloc 4 |
| FAQ | `#faq` | Bloc 5 |
| **Accès FLI** (bouton mis en avant, couleur d'accent) | — | redirige vers `/auth` |

---

## 3. Bloc par bloc

### Bloc 1 — Hero (référence : Annexe 1)

**Mise en page :** grand titre à gauche + CTA, photo d'une personne réelle à droite avec 2-3 badges flottants, barre d'indicateurs en bas du bloc.

**Copy (FR — public cible francophone) :**
- Titre : « Formez-vous dans la langue de votre métier, sans sacrifier votre saison. »
- Sous-titre : « France Langues International conçoit des formations linguistiques sur mesure pour les moniteur·rices de ski, le personnel des remontées mécaniques, les pisteur·euses et l'hôtellerie de montagne. »
- CTA primaire (bouton) : « Réserver mon stage » → ancre `#formations` ou formulaire d'inscription existant
- CTA secondaire (lien texte) : « Découvrir la méthode » → `#methode`

**Badges flottants sur la photo** (à la place de « Rapidez / 100% Digital / Acessível ») :
- « Groupes de 6 max »
- « Financement FIFPL »
- « Certifié Qualiopi »

**Barre d'indicateurs (bas du bloc)** — données confirmées sur le site actuel :
- 87 % de stagiaires satisfait·es ou très satisfait·es
- 0,6 % de taux d'abandon
- 4,72/5 en qualité d'animation
- Depuis 2018

⚠️ **À confirmer avec Paula** : nombre total de moniteur·rices formé·es à ce jour, nombre d'écoles de ski partenaires — si disponible, remplacer un des 4 indicateurs ci-dessus par un chiffre plus parlant en acquisition (ex. « +X moniteurs formés chaque saison »).

**Assets nécessaires :** photo professionnelle (moniteur de ski en contexte, ou formateur/formatrice en session) — pas de stock générique type Empregga.

---

### Bloc 2 — Vidéo institutionnelle (référence : Annexe 5)

**Mise en page :** texte à gauche, vignette vidéo à droite avec bouton lecture.

**Copy :**
- Titre : « Découvrez comment se déroule votre formation »
- Sous-texte : « Un parcours structuré, testé sur plus de 500 sessions. »
- CTA : « Regarder la vidéo » (lien/lightbox)

**Vidéo :** réutiliser l'embed déjà en production sur stages-langues.fr :
`https://www.youtube.com/embed/1cIivE5ggCk`

**Contenu complémentaire pour illustrer les 5 étapes du déroulement (repris du site actuel) sous la vidéo, en mini-liste :**
1. Test de niveau à l'inscription
2. Objectifs définis avec le groupe
3. Formation adaptée aux niveaux et besoins
4. Nouveau test en fin de formation
5. Questionnaire de satisfaction

---

### Bloc 3 — Carrousel de partenaires (référence : Annexe 4)

**Mise en page :** bande horizontale, fond sombre ou clair contrastant, logos en niveaux de gris/blanc, défilement automatique (carrousel infini).

**Titre :** « Ils nous font confiance »

**Logos à intégrer** (à collecter en haute résolution) :
- Réseau ESF (national)
- Stations/écoles partenaires citées dans les témoignages actuels : Courchevel 1850, Val Cenis, Valmorel, et autres stations actives (St Sorlin d'Arves, La Rosière, Saint-Gervais, La Clusaz, Piau Engaly)
- Badge Qualiopi
- Logo FIFPL / OPCO (financement)
- Linguaskill / Bright (organismes de certification)

⚠️ **À confirmer :** liste définitive des logos autorisés à l'usage (accord des écoles de ski), fichiers vectoriels/PNG haute résolution.

---

### Bloc 4 — Formations / différenciateurs (référence : Annexe 3)

**Mise en page :** grille de 6 items avec icône + titre + phrase courte, puis bandeau CTA en dessous avec fond coloré et bouton.

**6 items** (adaptés des 6 de l'Empregga) :

| Icône | Titre | Texte |
|---|---|---|
| Groupe | Groupes de 6 maximum | Chaque stagiaire participe activement, sans se noyer dans la masse. |
| Formateur | Un formateur dédié | Mise en situation directement liée à votre métier : ski, accueil, remontées. |
| Financement | Financement facilité | FIFPL, OPCO : FLI gère le dossier administratif pour vous. |
| Flexibilité | Présentiel ou en ligne | Cours individuels, en binôme, ou stages intensifs — à la demande. |
| Certification | Formation certifiante | Centre agréé Linguaskill et Bright, éligible Qualiopi. |
| Mesure | Progression mesurée | Test d'entrée et de sortie, résultats transmis à votre école de ski. |

**Bandeau CTA (fond coloré, style bandeau orange de l'Empregga) :**
- Titre : « Organisez la formation linguistique de votre équipe, sans complexité administrative »
- Bouton : « Demander un devis » ou « Je réserve mon stage » → lien vers formulaire d'inscription existant ou contact (`info@fli.fr` / 04 79 28 21 09)

---

### Bloc 5 — FAQ (référence : Annexe 2, après le footer)

**Mise en page :** accordéon, titre à gauche + petit encart « Vous n'avez pas trouvé votre réponse ? » avec bouton de contact, liste de questions à droite (colonne, chevrons +/-).

**Titre :** « Une question ? »

**Questions/réponses** (adaptées des 11 de l'Empregga au contexte FLI) :

1. **Je n'ai jamais suivi de formation en langues, c'est fait pour moi ?**
   Oui. Un test de niveau à l'inscription permet de vous placer dans le bon groupe, quel que soit votre point de départ.

2. **Et si mon niveau ne correspond pas aux autres inscrits ?**
   Nous vous orientons vers une alternative adaptée (autre groupe, cours individuel) plutôt que de vous imposer un format inadapté.

3. **Puis-je concilier la formation avec ma saison de ski ?**
   Oui : stages intensifs en automne, cours individuels ou en ligne à la demande toute l'année.

4. **Le coût est-il élevé ?**
   750 €/personne pour un stage intensif de 20h. Le FIFPL peut financer jusqu'à 900 €/an pour les formations individuelles.

5. **Et si je dois annuler mon inscription ?**
   Les frais de dossier (150 €) sont remboursables en cas d'annulation justifiée ou d'insuffisance de participants, sous 7 jours après inscription.

6. **Faut-il déjà avoir le BE (Brevet d'État) pour s'inscrire ?**
   Oui pour le stage moniteurs de ski — être titulaire du BE ou en formation.

7. **Combien de temps avant de commencer les cours ?**
   Les inscriptions se clôturent 7 jours avant le début du stage ; au-delà, nous contacter directement selon les places restantes.

8. **Puis-je suivre une formation tout en étant en poste ?**
   Oui, les formules individuelles en ligne (6h à 18h) s'organisent à votre rythme.

9. **Ça fonctionne dans toutes les stations ?**
   Nous intervenons dans l'ensemble du réseau ESF et auprès des stations partenaires ; contactez-nous pour organiser une formation dans votre station.

10. **Et si j'ai un handicap ou besoin d'un aménagement ?**
    Parlez-en dès l'inscription à notre référente handicap, Paula Rangel Halbwachs — nous étudions ensemble les adaptations possibles, avec l'appui du réseau RHF.

11. **Quel suivi est proposé pendant et après la formation ?**
    Test de progression en fin de stage, questionnaire de satisfaction, et transmission des résultats à votre école de ski.

**Encart contact (comme l'encart Empregga « Não encontrou o que gostaria? ») :**
« Vous n'avez pas trouvé votre réponse ? » → bouton « Nous contacter » → `info@fli.fr` / 04 79 28 21 09

---

## 4. Header / bouton « Accès FLI »

- Bouton mis en avant visuellement (couleur de contraste, style « Conecte Grátis » de l'Empregga)
- Texte : **« Accès FLI »**
- Action : navigation vers la route `/auth` déjà existante (route interne de la même app, pas un lien externe)
- Fixe sur tous les blocs (header sticky)

---

## 5. Identité visuelle — points en suspens

La spec ci-dessus ne définit ni palette ni typographie car la charte graphique actuelle de FLI n'est pas confirmée. Avant de coder dans Cursor, confirmer :

- [ ] Palette de couleurs officielle (quelles couleurs utilise le logo FLI actuel ? Voir `logo-fli.png` sur stages-langues.fr)
- [ ] Police typographique (si déjà définie dans le design system de l'app FLI Formation/Lovable)
- [ ] La LP doit-elle réutiliser le design system de l'app (composants shadcn/ui déjà utilisés) ou avoir une identité propre plus « marketing » ?

Suggestion : réutiliser le design system de l'app (Tailwind + shadcn déjà configurés dans le dépôt) pour la cohérence visuelle entre LP et plateforme, et éviter de dupliquer les tokens de design.

---

## 6. Architecture technique

- **Stack :** React + TypeScript + Tailwind (identique au dépôt `ski-linguist-hub`)
- **Nouvelle route :** `/` → composant `InstitutionalLanding.tsx`
- **Route existante :** `/auth` inchangée ; tableau de bord staff déplacé sur `/app` (`ADMIN_HOME_PATH`)
- **Navigation :** défilement doux (`scroll-behavior: smooth` ou lib type `react-scroll`) vers les ancres du menu
- **Carrousel de logos (bloc 3) :** composant à défilement automatique infini (ex. Embla Carousel, courant dans les stacks shadcn)
- **Vidéo (bloc 2) :** iframe YouTube embed, chargée à la demande
- **FAQ (bloc 5) :** composant accordéon (shadcn/ui `Accordion` si disponible dans le projet)
- **Responsive :** mobile-first, une bonne partie du public (moniteurs) accède depuis son téléphone
- **SEO de base :** title/meta description, og:image, même logique que le site actuel (`stages-langues.fr` a Yoast configuré — répliquer des meta tags équivalentes)

---

## 7. Assets à réunir avant l'implémentation

| Élément | Statut |
|---|---|
| Photo hero (moniteur/formateur en contexte) | À fournir |
| Logos partenaires (ESF, stations, OPCO, Linguaskill, Bright) en haute résolution | À fournir |
| Palette de couleurs officielle FLI | À confirmer |
| Nombre réel de moniteurs formés / écoles partenaires (pour la barre d'indicateurs) | À confirmer |
| Vidéo institutionnelle (existe déjà, embed YouTube) | ✅ Disponible |
| Textes de témoignages (3 existent déjà sur le site actuel, réutilisables si on veut ajouter un bloc) | ✅ Disponible |

Page de validation des visuels disponibles dans le dépôt : `/mockup/lp-assets`.

---

## 8. Prochaines étapes suggérées

1. Valider avec Paula la palette de couleurs et les assets en suspens (sections 5 et 7)
2. Confirmer si la LP part avec la même branche/déploiement que l'app FLI Formation ou sur une branche séparée jusqu'à la recette d'octobre
3. Relire la copy finale en français avant publication (ton formel, adapté au public professionnel)
