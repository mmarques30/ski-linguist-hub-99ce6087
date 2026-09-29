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
- "Groupes de 6 max"
- "Financement FIFPL"
- "Certifié Qualiopi"

**Barra de indicadores (rodapé da dobra)** — dados confirmados no site atual:
- 87% de stagiaires satisfait·es ou très satisfait·es
- 0,6% de taux d'abandon
- 4,72/5 en qualité d'animation
- Depuis 2018

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
| Groupe | Groupes de 6 maximum | Chaque stagiaire participe activement, sans se noyer dans la masse. |
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

**Questions/réponses proposées** (adaptées des 11 de l'Empregga au contexte FLI) :

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

**Encart contact (comme l'encart Empregga "Não encontrou o que gostaria?"):**
"Vous n'avez pas trouvé votre réponse ?" → bouton "Nous contacter" → `info@fli.fr` / 04 79 28 21 09

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
