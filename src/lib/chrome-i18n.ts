/**
 * Onda D6 — libellés du chrome (sidebar, breadcrumbs, header).
 * La langue par défaut de l'app reste le français ; le sélecteur bascule ces clés.
 */
import type { Translations } from "@/contexts/LanguageContext";

export const CHROME_SECTIONS: Record<string, Translations> = {
  operations: { fr: "Opérations", "pt-BR": "Operações", en: "Operations" },
  commercial: { fr: "Commercial", "pt-BR": "Comercial", en: "Sales" },
  finance: { fr: "Finance", "pt-BR": "Finanças", en: "Finance" },
  qualite: { fr: "Qualité", "pt-BR": "Qualidade", en: "Quality" },
  portails: { fr: "Portails", "pt-BR": "Portais", en: "Portals" },
  administration: { fr: "Administration", "pt-BR": "Administração", en: "Administration" },
};

export const CHROME_NAV: Record<string, Translations> = {
  "/inscriptions": { fr: "Inscriptions", "pt-BR": "Inscrições", en: "Registrations" },
  "/inscriptions/schedule-validation": {
    fr: "Constitution des groupes",
    "pt-BR": "Constituição dos grupos",
    en: "Group scheduling",
  },
  "/students": { fr: "Stagiaires", "pt-BR": "Alunos", en: "Students" },
  "/formateurs": { fr: "Formateurs", "pt-BR": "Formadores", en: "Instructors" },
  "/tests": { fr: "Tests de niveau", "pt-BR": "Testes de nível", en: "Level tests" },
  "/formateur/evaluations": {
    fr: "Évaluations orales",
    "pt-BR": "Avaliações orais",
    en: "Oral evaluations",
  },
  "/gestion/commercial": {
    fr: "Pipeline commercial",
    "pt-BR": "Pipeline comercial",
    en: "Sales pipeline",
  },
  "/gestion/partenaires": { fr: "Partenaires", "pt-BR": "Parceiros", en: "Partners" },
  "/gestion/moniteurs": {
    fr: "Moniteurs de ski",
    "pt-BR": "Monitores de ski",
    en: "Ski instructors",
  },
  "/invoices": { fr: "Factures", "pt-BR": "Faturas", en: "Invoices" },
  "/finance/payments": { fr: "Paiements", "pt-BR": "Pagamentos", en: "Payments" },
  "/finance": { fr: "Pilotage", "pt-BR": "Painel", en: "Dashboard" },
  "/finance/tresorerie": { fr: "Trésorerie", "pt-BR": "Tesouraria", en: "Cash flow" },
  "/satisfaction-stats": { fr: "Satisfaction", "pt-BR": "Satisfação", en: "Satisfaction" },
  "/amelioration": { fr: "Amélioration", "pt-BR": "Melhoria", en: "Improvement" },
  "/qualite/audit": { fr: "Audit Qualiopi", "pt-BR": "Auditoria Qualiopi", en: "Qualiopi audit" },
  "/qualite/historique": {
    fr: "Journal d'audit",
    "pt-BR": "Diário de auditoria",
    en: "Audit log",
  },
  "/portails/stagiaire": {
    fr: "Espace stagiaire",
    "pt-BR": "Espaço aluno",
    en: "Student portal",
  },
  "/portails/formateur": {
    fr: "Espace formateur",
    "pt-BR": "Espaço formador",
    en: "Instructor portal",
  },
  "/admin/import": { fr: "Import", "pt-BR": "Importação", en: "Import" },
  "/admin/emails": { fr: "Emails", "pt-BR": "E-mails", en: "Emails" },
  "/admin/registration-documents": {
    fr: "Modèles documents",
    "pt-BR": "Modelos de documentos",
    en: "Document templates",
  },
  "/admin/phrases": { fr: "Phrases", "pt-BR": "Frases", en: "Phrases" },
  "/admin/seasons": { fr: "Saisons", "pt-BR": "Temporadas", en: "Seasons" },
  "/admin/testing": { fr: "Tests QA", "pt-BR": "Testes QA", en: "QA tests" },
  "/admin/users": { fr: "Utilisateurs", "pt-BR": "Utilizadores", en: "Users" },
  "/settings": { fr: "Paramètres", "pt-BR": "Configurações", en: "Settings" },
};

/**
 * Libellés des entrées repliables et des sous-menus (arborescence 3 niveaux).
 * Une clé par regroupement produit ; les feuilles qui pointent vers une page
 * entière réutilisent CHROME_NAV.
 */
export const CHROME_NAV_GROUPS: Record<string, Translations> = {
  // Opérations
  inscriptionsAll: {
    fr: "Toutes les inscriptions",
    "pt-BR": "Todas as inscrições",
    en: "All registrations",
  },
  inscriptionsPending: { fr: "À traiter", "pt-BR": "A tratar", en: "To process" },
  inscriptionsDone: { fr: "Terminées", "pt-BR": "Concluídas", en: "Completed" },
  planning: { fr: "Planning & sessions", "pt-BR": "Agenda & sessões", en: "Schedule & sessions" },
  evaluations: {
    fr: "Tests & évaluations",
    "pt-BR": "Testes & avaliações",
    en: "Tests & evaluations",
  },

  // Commercial
  commercialPipeline: { fr: "Pipeline", "pt-BR": "Pipeline", en: "Pipeline" },
  commercialAnalytics: { fr: "Analyses", "pt-BR": "Análises", en: "Analytics" },
  moniteursDates: {
    fr: "Dates de formation",
    "pt-BR": "Datas de formação",
    en: "Training dates",
  },
  moniteursEcoles: { fr: "Écoles de ski", "pt-BR": "Escolas de ski", en: "Ski schools" },
  moniteursBase: { fr: "Base moniteurs", "pt-BR": "Base de monitores", en: "Instructor base" },

  // Finance
  facturation: { fr: "Facturation", "pt-BR": "Faturamento", en: "Billing" },
  invoicesToCheck: { fr: "À vérifier", "pt-BR": "A verificar", en: "To review" },
  financeOverview: { fr: "Vue d'ensemble", "pt-BR": "Visão geral", en: "Overview" },
  financeAnalyses: { fr: "Analyses", "pt-BR": "Análises", en: "Analytics" },
  financeRentabilite: { fr: "Rentabilité", "pt-BR": "Rentabilidade", en: "Profitability" },
  tresoreriePrevisionnel: { fr: "Prévisionnel", "pt-BR": "Previsão", en: "Forecast" },
  tresorerieCharges: { fr: "Charges fixes", "pt-BR": "Custos fixos", en: "Fixed costs" },

  // Qualité
  satisfactionStats: { fr: "Statistiques", "pt-BR": "Estatísticas", en: "Statistics" },
  satisfactionComparison: { fr: "Comparaison", "pt-BR": "Comparação", en: "Comparison" },
  qualiopi: { fr: "Qualiopi", "pt-BR": "Qualiopi", en: "Qualiopi" },

  // Administration
  communications: { fr: "Communications", "pt-BR": "Comunicações", en: "Communications" },
  emailModels: { fr: "Modèles d'emails", "pt-BR": "Modelos de e-mail", en: "Email templates" },
  emailJournal: {
    fr: "Journal des envois",
    "pt-BR": "Diário de envios",
    en: "Send log",
  },
  donnees: { fr: "Données & recette", "pt-BR": "Dados & testes", en: "Data & QA" },
  importPhrases: { fr: "Import de phrases", "pt-BR": "Importação de frases", en: "Phrase import" },
  configuration: { fr: "Configuration", "pt-BR": "Configuração", en: "Configuration" },
  settingsOrganisation: { fr: "Organisation", "pt-BR": "Organização", en: "Organization" },
  settingsLanguages: {
    fr: "Langues & modalités",
    "pt-BR": "Idiomas & modalidades",
    en: "Languages & modes",
  },
  settingsNotifications: { fr: "Notifications", "pt-BR": "Notificações", en: "Notifications" },
  settingsIntegrations: { fr: "Intégrations", "pt-BR": "Integrações", en: "Integrations" },
};

export const CHROME_UI: Record<string, Translations> = {
  logout: { fr: "Déconnexion", "pt-BR": "Sair", en: "Sign out" },
  frozen: { fr: "gelé", "pt-BR": "congelado", en: "frozen" },
  notifications: { fr: "Notifications", "pt-BR": "Notificações", en: "Notifications" },
  markAllRead: {
    fr: "Tout marquer comme lu",
    "pt-BR": "Marcar tudo como lido",
    en: "Mark all as read",
  },
  noNotifications: {
    fr: "Aucune notification",
    "pt-BR": "Nenhuma notificação",
    en: "No notifications",
  },
  seeAll: { fr: "Voir tout", "pt-BR": "Ver tudo", en: "See all" },
  home: { fr: "Accueil", "pt-BR": "Início", en: "Home" },
  details: { fr: "Détails", "pt-BR": "Detalhes", en: "Details" },
};

/** Segments d'URL → libellé fil d'Ariane. */
export const CHROME_BREADCRUMB: Record<string, Translations> = {
  finance: CHROME_SECTIONS.finance,
  analyses: { fr: "Analyses", "pt-BR": "Análises", en: "Analytics" },
  rentabilite: { fr: "Rentabilité", "pt-BR": "Rentabilidade", en: "Profitability" },
  tresorerie: CHROME_NAV["/finance/tresorerie"],
  payments: CHROME_NAV["/finance/payments"],
  "charges-fixes": { fr: "Charges fixes", "pt-BR": "Custos fixos", en: "Fixed costs" },
  gestion: { fr: "Gestion", "pt-BR": "Gestão", en: "Management" },
  commercial: { fr: "Commercial", "pt-BR": "Comercial", en: "Sales" },
  partenaires: CHROME_NAV["/gestion/partenaires"],
  moniteurs: { fr: "Moniteurs", "pt-BR": "Monitores", en: "Monitors" },
  inscriptions: CHROME_NAV["/inscriptions"],
  "schedule-validation": CHROME_NAV["/inscriptions/schedule-validation"],
  invoices: CHROME_NAV["/invoices"],
  students: CHROME_NAV["/students"],
  tests: CHROME_NAV["/tests"],
  classes: { fr: "Planning", "pt-BR": "Agenda", en: "Schedule" },
  sessions: { fr: "Sessions", "pt-BR": "Sessões", en: "Sessions" },
  documents: { fr: "Documents", "pt-BR": "Documentos", en: "Documents" },
  settings: CHROME_NAV["/settings"],
  admin: CHROME_SECTIONS.administration,
  import: CHROME_NAV["/admin/import"],
  emails: CHROME_NAV["/admin/emails"],
  "registration-documents": CHROME_NAV["/admin/registration-documents"],
  phrases: CHROME_NAV["/admin/phrases"],
  testing: CHROME_NAV["/admin/testing"],
  users: CHROME_NAV["/admin/users"],
  seasons: CHROME_NAV["/admin/seasons"],
  formateur: { fr: "Formateur", "pt-BR": "Formador", en: "Instructor" },
  evaluations: { fr: "Évaluations", "pt-BR": "Avaliações", en: "Evaluations" },
  amelioration: CHROME_NAV["/amelioration"],
  "satisfaction-stats": CHROME_NAV["/satisfaction-stats"],
  formateurs: CHROME_NAV["/formateurs"],
  qualite: CHROME_SECTIONS.qualite,
  audit: { fr: "Audit Qualiopi", "pt-BR": "Auditoria Qualiopi", en: "Qualiopi audit" },
  historique: { fr: "Historique", "pt-BR": "Histórico", en: "History" },
  student: CHROME_NAV["/portails/stagiaire"],
  dashboard: { fr: "Tableau de bord", "pt-BR": "Painel", en: "Dashboard" },
  portails: CHROME_SECTIONS.portails,
  stagiaire: { fr: "Stagiaire", "pt-BR": "Aluno", en: "Student" },
};
