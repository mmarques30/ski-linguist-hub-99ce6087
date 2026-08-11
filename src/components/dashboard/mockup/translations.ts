import type { Translations } from "@/contexts/LanguageContext";

type Dict = Record<string, Translations>;

export const tx = {
  // Shell / header
  pageTitle: { fr: "Pilotage", "pt-BR": "Pilotagem", en: "Cockpit" },
  breadcrumbRoot: { fr: "Direction", "pt-BR": "Direção", en: "Management" },
  breadcrumbCurrent: { fr: "Pilotage", "pt-BR": "Pilotagem", en: "Cockpit" },
  subtitle: {
    fr: "Vue consolidée de l'activité, de la marge et des opérations",
    "pt-BR": "Visão consolidada da atividade, da margem e das operações",
    en: "Consolidated view of activity, margin and operations",
  },
  season: { fr: "Saison", "pt-BR": "Temporada", en: "Season" },
  updatedNow: { fr: "Actualisé à l'instant", "pt-BR": "Atualizado agora", en: "Updated just now" },
  search: { fr: "Rechercher…", "pt-BR": "Buscar…", en: "Search…" },
  export: { fr: "Exporter", "pt-BR": "Exportar", en: "Export" },
  refresh: { fr: "Actualiser", "pt-BR": "Atualizar", en: "Refresh" },
  toggleTheme: { fr: "Thème clair / sombre", "pt-BR": "Tema claro / escuro", en: "Light / dark theme" },
  mockupBadge: { fr: "Maquette", "pt-BR": "Mockup", en: "Mockup" },
  mockupNotice: {
    fr: "Maquette de validation — données fictives, non connectée à la base.",
    "pt-BR": "Mockup de validação — dados fictícios, não conectado ao banco.",
    en: "Validation mockup — sample data, not connected to the database.",
  },

  // Period selector
  periodToday: { fr: "Aujourd'hui", "pt-BR": "Hoje", en: "Today" },
  period7d: { fr: "7 jours", "pt-BR": "7 dias", en: "7 days" },
  periodMonth: { fr: "Mois", "pt-BR": "Mês", en: "Month" },
  periodQuarter: { fr: "Trimestre", "pt-BR": "Trimestre", en: "Quarter" },
  periodSeason: { fr: "Saison", "pt-BR": "Temporada", en: "Season" },
  periodLabel: { fr: "Période", "pt-BR": "Período", en: "Period" },
  vsPrevious: { fr: "vs période précédente", "pt-BR": "vs período anterior", en: "vs previous period" },

  // KPI band
  kpiRevenue: { fr: "Chiffre d'affaires", "pt-BR": "Receita faturada", en: "Revenue" },
  kpiRevenueHint: { fr: "Facturé sur la période", "pt-BR": "Faturado no período", en: "Invoiced in period" },
  kpiMargin: { fr: "Marge nette", "pt-BR": "Margem líquida", en: "Net margin" },
  kpiMarginHint: { fr: "Après coûts directs", "pt-BR": "Após custos diretos", en: "After direct costs" },
  kpiGoal: { fr: "Objectif de saison", "pt-BR": "Meta da temporada", en: "Season goal" },
  kpiGoalHint: { fr: "Objectif", "pt-BR": "Meta", en: "Target" },
  kpiInscriptions: { fr: "Nouvelles inscriptions", "pt-BR": "Novas inscrições", en: "New enrolments" },
  kpiInscriptionsHint: { fr: "confirmées", "pt-BR": "confirmadas", en: "confirmed" },
  pendingShort: { fr: "en attente", "pt-BR": "pendentes", en: "pending" },

  // Revenue mix
  revenueMixTitle: { fr: "Répartition du chiffre d'affaires", "pt-BR": "Composição da receita", en: "Revenue breakdown" },
  revenueMixDesc: {
    fr: "Par activité, sur la période sélectionnée",
    "pt-BR": "Por atividade, no período selecionado",
    en: "By activity, for the selected period",
  },
  totalBilled: { fr: "Total facturé", "pt-BR": "Total faturado", en: "Total billed" },
  mixFormation: { fr: "Formations langues", "pt-BR": "Formações de idiomas", en: "Language training" },
  mixSkiMonitors: { fr: "Moniteurs ski (ESF)", "pt-BR": "Monitores de esqui (ESF)", en: "Ski monitors (ESF)" },
  mixTests: { fr: "Tests & certifications", "pt-BR": "Testes & certificações", en: "Tests & certifications" },
  mixSubcontracting: { fr: "Sous-traitance", "pt-BR": "Subcontratação", en: "Subcontracting" },

  // Micro tiles + trend
  averageTicket: { fr: "Ticket moyen", "pt-BR": "Ticket médio", en: "Average ticket" },
  conversionRate: { fr: "Taux de conversion", "pt-BR": "Taxa de conversão", en: "Conversion rate" },
  conversionHint: { fr: "Leads → inscriptions", "pt-BR": "Leads → inscrições", en: "Leads → enrolments" },
  trendTitle: { fr: "Marge nette cumulée", "pt-BR": "Margem líquida acumulada", en: "Cumulative net margin" },
  trendDesc: { fr: "CA vs coûts directs", "pt-BR": "Receita vs custos diretos", en: "Revenue vs direct costs" },
  legendRevenue: { fr: "Chiffre d'affaires", "pt-BR": "Receita", en: "Revenue" },
  legendCosts: { fr: "Coûts directs", "pt-BR": "Custos diretos", en: "Direct costs" },

  // Funnel
  funnelTitle: { fr: "Entonnoir commercial → encaissement", "pt-BR": "Funil comercial → recebimento", en: "Commercial → cash funnel" },
  funnelDesc: {
    fr: "Conversion à chaque étape du cycle de vente",
    "pt-BR": "Conversão em cada etapa do ciclo de venda",
    en: "Conversion at each stage of the sales cycle",
  },
  funnelLeads: { fr: "Leads", "pt-BR": "Leads", en: "Leads" },
  funnelTests: { fr: "Tests programmés", "pt-BR": "Testes agendados", en: "Tests booked" },
  funnelInscriptions: { fr: "Inscriptions", "pt-BR": "Inscrições", en: "Enrolments" },
  funnelActiveClasses: { fr: "Formations actives", "pt-BR": "Turmas ativas", en: "Active classes" },
  funnelInvoiced: { fr: "Facturées", "pt-BR": "Faturadas", en: "Invoiced" },
  funnelPaid: { fr: "Encaissées", "pt-BR": "Recebidas", en: "Collected" },
  globalConversion: { fr: "Conversion globale", "pt-BR": "Conversão global", en: "End-to-end conversion" },

  // Inscriptions table
  tableTitle: { fr: "Inscriptions récentes", "pt-BR": "Inscrições recentes", en: "Recent enrolments" },
  tableDesc: {
    fr: "Dernières entrées, triables par valeur ou par date",
    "pt-BR": "Últimas entradas, ordenáveis por valor ou data",
    en: "Latest entries, sortable by value or date",
  },
  colStudent: { fr: "Stagiaire", "pt-BR": "Aluno", en: "Student" },
  colLanguage: { fr: "Langue", "pt-BR": "Idioma", en: "Language" },
  colModality: { fr: "Modalité", "pt-BR": "Modalidade", en: "Modality" },
  colStart: { fr: "Début", "pt-BR": "Início", en: "Start" },
  colValue: { fr: "Valeur", "pt-BR": "Valor", en: "Value" },
  colStatus: { fr: "Statut", "pt-BR": "Status", en: "Status" },
  viewAll: { fr: "Voir tout", "pt-BR": "Ver tudo", en: "View all" },
  statusConfirmed: { fr: "Confirmée", "pt-BR": "Confirmada", en: "Confirmed" },
  statusPending: { fr: "En attente", "pt-BR": "Pendente", en: "Pending" },
  statusInvoiced: { fr: "Facturée", "pt-BR": "Faturada", en: "Invoiced" },
  statusInProgress: { fr: "En cours", "pt-BR": "Em andamento", en: "In progress" },

  // Class readiness
  readinessTitle: { fr: "Préparation des formations", "pt-BR": "Preparação das turmas", en: "Class readiness" },
  readinessDesc: {
    fr: "Prochains départs et points bloquants",
    "pt-BR": "Próximas turmas e pontos de bloqueio",
    en: "Upcoming starts and blockers",
  },
  startsInDays: { fr: "J-", "pt-BR": "D-", en: "D-" },
  checkStudents: { fr: "Effectif", "pt-BR": "Alunos", en: "Headcount" },
  checkLocation: { fr: "Lieu", "pt-BR": "Local", en: "Location" },
  checkInstructor: { fr: "Formateur", "pt-BR": "Formador", en: "Instructor" },
  checkMaterials: { fr: "Matériel", "pt-BR": "Material", en: "Materials" },
  ready: { fr: "Prête", "pt-BR": "Pronta", en: "Ready" },
  blocked: { fr: "À traiter", "pt-BR": "A tratar", en: "Needs action" },
  seats: { fr: "places", "pt-BR": "vagas", en: "seats" },

  // Alerts rail
  alertsTitle: { fr: "À traiter", "pt-BR": "A tratar", en: "Needs attention" },
  alertsDesc: { fr: "Exceptions à arbitrer", "pt-BR": "Exceções para decidir", en: "Exceptions to resolve" },
  overdueInvoices: { fr: "Factures en retard", "pt-BR": "Faturas em atraso", en: "Overdue invoices" },
  testsToEvaluate: { fr: "Tests à évaluer", "pt-BR": "Testes a avaliar", en: "Tests to evaluate" },
  classesWithoutInstructor: { fr: "Formations sans formateur", "pt-BR": "Turmas sem formador", en: "Classes without instructor" },
  contractsExpiring: { fr: "Contrats à renouveler", "pt-BR": "Contratos a renovar", en: "Contracts to renew" },
  surveysPending: { fr: "Enquêtes non répondues", "pt-BR": "Pesquisas sem resposta", en: "Surveys not answered" },

  // Activity rail
  activityTitle: { fr: "Activité récente", "pt-BR": "Atividade recente", en: "Recent activity" },
  inscriptionCreated: { fr: "Inscription créée", "pt-BR": "Inscrição criada", en: "Enrolment created" },
  invoicePaid: { fr: "Facture encaissée", "pt-BR": "Fatura recebida", en: "Invoice paid" },
  evaluationSubmitted: { fr: "Évaluation validée", "pt-BR": "Avaliação validada", en: "Evaluation submitted" },
  instructorAssigned: { fr: "Formateur affecté", "pt-BR": "Formador alocado", en: "Instructor assigned" },
  partnerContractSigned: { fr: "Contrat partenaire signé", "pt-BR": "Contrato de parceiro assinado", en: "Partner contract signed" },
  minutesAgo: { fr: "min", "pt-BR": "min", en: "min" },
  hoursAgo: { fr: "h", "pt-BR": "h", en: "h" },

  // Team rail
  teamTitle: { fr: "Équipe en activité", "pt-BR": "Equipe em atividade", en: "Team on duty" },
  teamDesc: { fr: "Charge de la semaine", "pt-BR": "Carga da semana", en: "This week's load" },
  instructor: { fr: "Formateur", "pt-BR": "Formador", en: "Instructor" },
  coordinator: { fr: "Coordination", "pt-BR": "Coordenação", en: "Coordination" },
  commercial: { fr: "Commercial", "pt-BR": "Comercial", en: "Sales" },
  load: { fr: "charge", "pt-BR": "carga", en: "load" },

  // Satisfaction
  satisfactionTitle: { fr: "Satisfaction", "pt-BR": "Satisfação", en: "Satisfaction" },
  responsesCount: { fr: "réponses", "pt-BR": "respostas", en: "responses" },

  // Rail section labels (mobile accordion)
  railTitle: { fr: "Suivi & alertes", "pt-BR": "Acompanhamento & alertas", en: "Monitoring & alerts" },
} satisfies Dict;
