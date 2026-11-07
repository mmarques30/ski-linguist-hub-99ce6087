# FLI — Nova Landing Page Institucional
### Spec técnico para implementação no Cursor
Referência visual: [Empregga — Site Institucional (Behance)](https://www.behance.net/gallery/239766373/Site-Institucional-Empregga)
Fonte de copy/conteúdo: [stages-langues.fr](https://www.stages-langues.fr) (site atual da FLI)
Repositório de destino: `ski-linguist-hub` (mmarques30/ski-linguist-hub-99ce6087) — React + TypeScript + Tailwind + Supabase (Lovable)

---

## 1. Objetivo

Hoje, `plateforme.fli.fr` abre direto em `/auth`. Vamos inverter isso: a raiz do domínio passa a servir uma landing page institucional, e o acesso ao sistema (login) passa a ser uma ação deliberada via botão no menu.

**Mudança de rota:**
- `plateforme.fli.fr/` → nova LP institucional (este spec)
- `plateforme.fli.fr/auth` → tela de login atual, sem alterações
- Botão "Acesso FLI" no header da LP → link/rota para `/auth`

Não é um site separado. É uma nova rota dentro do mesmo projeto, reaproveitando o stack já em produção.

---

## 2. Estrutura geral (sitemap de uma página + FAQ)

```
Header fixo (logo + menu + CTA "Acesso FLI")
├── #inicio        → Dobra 1: Hero
├── #metodo         → Dobra 2: Vídeo institucional
├── #parceiros      → Dobra 3: Carrossel de logos (entre dobra 2 e dobra 4)
├── #formacoes      → Dobra 4: Serviços/diferenciais
Footer
├── #faq            → Dobra 5: FAQ (após o footer, fora do fluxo principal)
```

Footer : marque officielle Qualiopi (catégorie « Actions de formation »), sur fond blanc.

Menu do header (scroll suave para cada âncora, exceto o CTA):

| Label do menu | Âncora | Dobra |
|---|---|---|
| Logo FLI | topo | — |
| Nosso Método | `#metodo` | Dobra 2 |
| Parceiros | `#parceiros` | Dobra 3 |
| Formações | `#formacoes` | Dobra 4 |
| FAQ | `#faq` | Dobra 5 |
| **Acesso FLI** (botão destacado, cor de destaque) | — | redireciona para `/auth` |

---

## 3. Dobra a dobra

### Dobra 1 — Hero (referência: Anexo 1)

**Layout:** título grande à esquerda + CTA, foto de pessoa real à direita com 2-3 badges flutuantes, barra de indicadores no rodapé da dobra.

**Copy proposta (FR — público-alvo francês):**
- Headline: "Formez-vous dans la langue de votre métier, sans sacrifier votre saison."
- Subheadline: "France Langues International conçoit des formations linguistiques sur mesure pour les moniteur·rices de ski, le personnel des remontées mécaniques, les pisteur·euses et l'hôtellerie de montagne."
- CTA primário (botão): "Réserver mon stage" → ancora para `#formacoes` ou formulaire d'inscription existant
- CTA secundário (link texto): "Découvrir la méthode" → `#metodo`

**Badges flutuantes na foto** (substituindo "Rapidez / 100% Digital / Acessível"):
- "Groupes de 8 personnes"
- "Financement FIFPL"
- "Certifié Qualiopi"

**Barra de indicadores (rodapé da dobra)** — dados confirmados no site atual:
- 87% de stagiaires satisfait·es ou très satisfait·es
- 0,6% de taux d'abandon
- 4,72/5 en qualité d'animation
- FLI a + de 40 ans

⚠️ **A confirmar com Paula** : nombre total de moniteur·rices formé·es à ce jour, nombre d'écoles de ski partenaires — si dispo, remplacer un des 4 indicateurs ci-dessus par un chiffre plus parlant en acquisition (ex. "+X moniteurs formés chaque saison").

**Assets nécessaires :** photo professionnelle (moniteur de ski en contexte, ou formateur/formatrice en session) — pas de stock générique type Empregga.

---

### Dobra 2 — Vidéo institutionnelle (référence : Anexo 5)

**Layout :** texte à gauche, thumbnail vidéo à droite avec bouton play.

**Copy proposta :**
- Titre : "Découvrez comment se déroule votre formation"
- Sous-texte : "Un parcours structuré, testé sur plus de 500 sessions."
- CTA : "Regarder la vidéo" (lien/lightbox)

**Vidéo :** réutiliser l'embed déjà en production sur stages-langues.fr :
`https://www.youtube.com/embed/1cIivE5ggCk`

**Contenu alternatif si on veut illustrer les 5 étapes du déroulement (repris du site actuel) sous la vidéo, en mini-liste :**
1. Test de niveau à l'inscription
2. Objectifs définis avec le groupe
3. Formation adaptée aux niveaux et besoins
4. Nouveau test en fin de formation
5. Questionnaire de satisfaction

---

### Dobra 3 — Carrossel de parceiros (référence : Anexo 4)

**Layout :** bande horizontale, fond sombre ou clair contrastant, logos en niveaux de gris/blanc, défilement automatique (carousel infini).

**Titre :** "Ils nous font confiance"

**Logos à intégrer** (à collecter en haute résolution) :
- Réseau ESF (national)
- Stations/écoles partenaires citées dans les témoignages actuels : Courchevel 1850, Val Cenis, Valmorel, et autres stations actives (St Sorlin d'Arves, La Rosière, Saint-Gervais, La Clusaz, Piau Engaly)
- Badge Qualiopi
- Logo FIFPL / OPCO (financement)
- Linguaskill / Bright (organismes de certification)

⚠️ **A confirmar :** liste définitive des logos autorisés à l'usage (accord des écoles de ski), fichiers vectoriels/PNG haute résolution.

---

### Dobra 4 — Formations / différenciateurs (référence : Anexo 3)

**Layout :** grille de 6 items avec icône + titre + phrase courte, puis bandeau CTA en dessous avec fond coloré et bouton.

**6 items proposés** (adaptés des 6 de l'Empregga) :

| Icône | Titre | Texte |
|---|---|---|
| Groupe | Groupes de 8 personnes | Chaque stagiaire participe activement, sans se noyer dans la masse. |
| Formateur | Un formateur dédié | Mise en situation directement liée à votre métier : ski, accueil, remontées. |
| Financement | Financement facilité | FIFPL, OPCO : FLI gère le dossier administratif pour vous. |
| Flexibilité | Présentiel ou en ligne | Cours individuels, en binôme, ou stages intensifs — à la demande. |
| Certification | Formation certifiante | Centre agréé Linguaskill et Bright, éligible Qualiopi. |
| Mesure | Progression mesurée | Test d'entrée et de sortie, résultats transmis à votre école de ski. |

**Bandeau CTA (fond coloré, style bandeau orange de l'Empregga) :**
- Titre : "Organisez la formation linguistique de votre équipe, sans complexité administrative"
- Bouton : "Demander un devis" ou "Je réserve mon stage" → lien vers formulaire d'inscription existant ou contact (`info@fli.fr` / 04 79 28 21 09)

---

### Dobra 5 — FAQ (référence : Anexo 2, après o footer)

**Layout :** accordéon, titre à gauche + petit encart "Vous n'avez pas trouvé votre réponse ?" avec bouton de contact, liste de questions à droite (colonne, chevrons +/-).

**Titre :** "Une question ?"

**Questions/réponses** (version du 21/10/2026, par thèmes — sources : conditions générales de formation `src/lib/conditions-generales-content.ts`, sessions 2026-2027 `docs/SESSIONS_2026_2027.md`, critères FIF PL `src/lib/fifpl-funding.ts`). Aucun tarif de stage : il dépend de l'école et s'affiche sur le formulaire.

*Avant de m'inscrire*
1. À qui s'adressent les formations FLI ? — professionnels de la montagne (moniteurs ESF ou indépendants, pisteurs, remontées mécaniques, hôtellerie d'altitude), groupes par niveau et par métier.
2. Quelles langues proposez-vous ? — anglais, espagnol, néerlandais, portugais brésilien, russe ; autres langues pour un groupe à partir de 6.
3. Je débute complètement, c'est fait pour moi ? — test de niveau → groupe homogène ; alternative si niveau isolé.
4. Comment se déroule un stage en station ? — 24 h sur une semaine, groupes de 8, matin/après-midi attribué ~10 jours avant, tests entrée/sortie, émargement, satisfaction.
5. Je ne peux pas me déplacer : quelles solutions en ligne ? — visio collective 24 h en 8 × 3 h (4 à 8 personnes) ; cours individuels par packs de 3 h (6 à 18 h).

*Inscription et financement*
6. Comment s'inscrire ? — formulaire en ligne + test de niveau ; code d'inscription ; convention et programme envoyés.
7. Comment se passe le règlement ? — frais de dossier 150 € déduits + solde avant le début, ou paiement intégral ; tarif affiché au récapitulatif ; exonération de TVA.
8. Puis-je faire financer ma formation ? — FIF PL (langues = cœur de métier, jusqu'à 900 €/an, visio comptée comme présentiel) ; OPCO pour les salariés ; FLI aide à estimer et prépare le dossier.
9. Et si je dois annuler ? — rétractation 10 jours après signature de la convention ; cours individuels en ligne annulables jusqu'à 24 h avant ; si FLI annule, seules les heures suivies sont dues.

*Pendant et après*
10. Quels documents vais-je recevoir ? — convention, programme, émargement, attestation, résultats des tests, facture ; transmission à l'école sur demande.
11. Mon école de ski peut-elle organiser un stage sur place ? — oui, FLI fournit formateur et organisation, l'école la salle (et parfois l'hébergement) ; forfait école possible → devis.
12. Et si j'ai un handicap ou besoin d'un aménagement ? — référente handicap Paula Rangel Halbwachs ; en ligne accessible PMR ; en station, locaux des partenaires ; orientation possible.
13. FLI est-elle certifiée Qualiopi ? — oui (actions de formation), condition des financements FIF PL / OPCO.

**Encart contact :** "Vous n'avez pas trouvé votre réponse ?" → bouton "Nous contacter". Comme "Demander un devis" (bloc 4), il ouvre un dialog contact (`ContactDialog`) : e-mail copiable, téléphone cliquable, e-mail pré-rempli — un simple `mailto:` ne fait rien sans client mail configuré (Paula, 21/10/2026).

---

## 4. Header / Botão "Acesso FLI"

- Botão de destaque visual (cor de contraste, estilo "Conecte Grátis" no Empregga)
- Texto: **"Acesso FLI"**
- Ação: navegação para rota `/auth` já existente no sistema (não é link externo, é rota interna do mesmo app)
- Fixo em todas as dobras (sticky header)

---

## 5. Identidade visual — pendências

O spec acima não define paleta/tipografia porque não temos a charte gráfica atual da FLI confirmada. Antes de codar no Cursor, confirmar:

- [ ] Paleta de cores oficial (logo FLI atual usa que cores? Ver `logo-fli.png` em stages-langues.fr)
- [ ] Fonte tipográfica (se já definida no design system do app FLI Formation/Lovable)
- [ ] Se a LP deve reaproveitar o design system do app (componentes shadcn/ui já usados) ou ter identidade própria mais "marketing"

Sugestão: reaproveitar o design system do app (Tailwind + shadcn já configurado no repo) para consistência visual entre LP e plataforma, evitando duplicar tokens de design.

**Décision typographie (Paula, 21/10/2026) :** titres et texte courant en **Outfit** (graisse 700 pour les titres). La police display Syne, jugée difficile à lire, est retirée.

---

## 6. Arquitetura técnica

- **Stack:** React + TypeScript + Tailwind (mesmo do repo `ski-linguist-hub`)
- **Rota nova:** `/` → componente `LandingPage.tsx` (ou equivalente)
- **Rota existente:** `/auth` inalterada
- **Navegação:** scroll suave (`scroll-behavior: smooth` ou lib tipo `react-scroll`) para as âncoras do menu
- **Carrossel de logos (Dobra 3):** componente de auto-scroll infinito (ex. Embla Carousel, já comum em stacks shadcn)
- **Vídeo (Dobra 2):** iframe YouTube embed, lazy-loaded
- **FAQ (Dobra 5):** componente accordion (shadcn/ui `Accordion` se disponível no projeto)
- **Responsivo:** mobile-first, já que boa parte do público (moniteurs) acessa via celular
- **SEO básico:** title/meta description, og:image, mesma lógica do site atual (`stages-langues.fr` tem Yoast configurado — replicar meta tags equivalentes)

---

## 7. Assets a reunir antes da implementação

| Item | Status |
|---|---|
| Foto hero (moniteur/formateur em contexto) | A fornecer |
| Logos de parceiros (ESF, stations, OPCO, Linguaskill, Bright) em alta resolução | A fornecer |
| Paleta de cores oficial FLI | A confirmar |
| Número real de moniteurs formés / écoles partenaires (para barra de indicadores) | A confirmar |
| Vídeo institucional (já existe, embed YouTube) | ✅ Disponível |
| Textos de témoignages (já existem 3 no site atual, reutilizáveis se quiser adicionar uma dobra extra) | ✅ Disponível |

---

## 8. Próximos passos sugeridos

1. Validar com Paula a paleta de cores e assets pendentes (seção 5 e 7)
2. Confirmar se a LP entra na mesma branch/deploy do app FLI Formation ou em branch separada até a recette de outubro
3. Passar este documento ao Cursor com instrução: "criar rota `/` conforme spec abaixo, mantendo `/auth` intacto"
4. Revisar copy final em francês antes de publicar (tom formal, adequado ao público profissional)
