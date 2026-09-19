/**
 * Onda D6 — libellés du chrome (sidebar, breadcrumbs, header).
 * La langue par défaut de l'app reste le français ; le sélecteur bascule ces clés.
 */
import type { Translations } from "@/contexts/LanguageContext";

export const CHROME_SECTIONS: Record<string, Translations> = {
  operations: { fr: "Opérations", "pt-BR": "Operações", en: "Operations" },
  commercial: {
    fr: "Commercial & partenaires",
    "pt-BR": "Comercial & parceiros",
    en: "Sales & partners",
  },
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
