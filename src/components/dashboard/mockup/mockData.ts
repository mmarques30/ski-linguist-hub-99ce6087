/**
 * Static sample data for the management dashboard mockup.
 *
 * Values are illustrative only — shaped to match what the real hooks already
 * expose (useFinancialKPIs, useFormationProfitability, useLeadKPIs,
 * useInscriptions, useSessions, useSatisfactionStats) so the wiring stage is a
 * one-to-one swap.
 */

export type Trend = "up" | "down" | "flat";

export interface KpiMock {
  id: string;
  value: number;
  /** Point-in-time comparison against the previous equivalent period. */
  delta: number;
  /** `pts` renders "+2.1 pts" instead of "+2.1%" — used for ratio KPIs. */
  deltaUnit: "percent" | "points";
  trend: Trend;
  /** Higher is better for most KPIs; costs invert the colour semantics. */
  inverse?: boolean;
}

export const seasonLabel = "2025 / 2026";

export const kpis = {
  revenue: {
    id: "revenue",
    value: 187_450,
    delta: 12.4,
    deltaUnit: "percent",
    trend: "up",
  } satisfies KpiMock,
  margin: {
    id: "margin",
    value: 31.8,
    delta: 2.1,
    deltaUnit: "points",
    trend: "up",
  } satisfies KpiMock,
  inscriptions: {
    id: "inscriptions",
    value: 148,
    delta: 11.3,
    deltaUnit: "percent",
    trend: "up",
  } satisfies KpiMock,
};

/** Season revenue target — drives the radial goal gauge. */
export const seasonGoal = {
  target: 264_000,
  achieved: 187_450,
  get percent() {
    return Math.round((this.achieved / this.target) * 100);
  },
};

export const inscriptionsBreakdown = {
  confirmed: 126,
  pending: 22,
};

/** Revenue mix by activity — donut chart. */
export const revenueMix = [
  { key: "formation", value: 112_470, color: "var(--fli-yellow)" },
  { key: "skiMonitors", value: 41_240, color: "var(--fli-blue)" },
  { key: "tests", value: 18_745, color: "var(--fli-teal)" },
  { key: "subcontracting", value: 14_995, color: "var(--fli-purple)" },
];

export const revenueMixTotal = revenueMix.reduce((sum, s) => sum + s.value, 0);

/** Secondary metrics shown as compact tiles beside the trend chart. */
export const microTiles = {
  averageTicket: { value: 1_267, delta: 4.2, trend: "up" as Trend },
  conversionRate: { value: 38.4, delta: 3.1, trend: "up" as Trend },
};

/** Monthly revenue vs. direct costs across the season — area chart. */
export const revenueVsCosts = [
  { month: "Sep", revenue: 9_400, costs: 7_100 },
  { month: "Oct", revenue: 14_800, costs: 10_300 },
  { month: "Nov", revenue: 21_600, costs: 14_900 },
  { month: "Dec", revenue: 32_400, costs: 21_800 },
  { month: "Jan", revenue: 38_900, costs: 25_600 },
  { month: "Fév", revenue: 34_200, costs: 23_100 },
  { month: "Mar", revenue: 22_750, costs: 15_400 },
  { month: "Avr", revenue: 13_400, costs: 9_640 },
];

export const netProfit = revenueVsCosts.reduce(
  (sum, m) => sum + (m.revenue - m.costs),
  0
);

/**
 * Commercial-to-cash funnel. `count` is absolute; the conversion rate to the
 * next stage is derived at render time so the numbers can never disagree.
 */
export const funnel = [
  { key: "leads", count: 386, route: "/gestion/commercial" },
  { key: "tests", count: 214, route: "/tests" },
  { key: "inscriptions", count: 148, route: "/inscriptions" },
  { key: "activeClasses", count: 112, route: "/formation/sessions" },
  { key: "invoiced", count: 98, route: "/invoices" },
  { key: "paid", count: 81, route: "/finance/payments" },
];

export type InscriptionStatus = "confirmed" | "pending" | "invoiced" | "inProgress";

export interface InscriptionRowMock {
  id: string;
  code: string;
  student: string;
  initials: string;
  language: string;
  modality: string;
  startDate: string;
  price: number;
  status: InscriptionStatus;
  accent: string;
}

export const recentInscriptions: InscriptionRowMock[] = [
  {
    id: "1",
    code: "FLI-2026-0148",
    student: "Camille Rousseau",
    initials: "CR",
    language: "Anglais",
    modality: "Présentiel",
    startDate: "2026-09-14",
    price: 1_840,
    status: "confirmed",
    accent: "var(--fli-blue)",
  },
  {
    id: "2",
    code: "FLI-2026-0147",
    student: "Mathieu Lefèvre",
    initials: "ML",
    language: "Espagnol",
    modality: "Visio",
    startDate: "2026-09-12",
    price: 1_260,
    status: "invoiced",
    accent: "var(--fli-teal)",
  },
  {
    id: "3",
    code: "FLI-2026-0146",
    student: "Sofia Marchetti",
    initials: "SM",
    language: "Français",
    modality: "Présentiel",
    startDate: "2026-09-08",
    price: 2_310,
    status: "inProgress",
    accent: "var(--fli-yellow)",
  },
  {
    id: "4",
    code: "FLI-2026-0145",
    student: "Lucas Bernard",
    initials: "LB",
    language: "Anglais",
    modality: "Moniteur ski",
    startDate: "2026-09-05",
    price: 980,
    status: "pending",
    accent: "var(--fli-orange)",
  },
  {
    id: "5",
    code: "FLI-2026-0144",
    student: "Élise Dumont",
    initials: "ED",
    language: "Italien",
    modality: "Présentiel",
    startDate: "2026-09-01",
    price: 1_540,
    status: "confirmed",
    accent: "var(--fli-purple)",
  },
  {
    id: "6",
    code: "FLI-2026-0143",
    student: "Tomás Ferreira",
    initials: "TF",
    language: "Français",
    modality: "Visio",
    startDate: "2026-08-28",
    price: 1_120,
    status: "invoiced",
    accent: "var(--fli-blue)",
  },
];

/**
 * Class-readiness checklist. Unlike the current dashboard, each flag maps to a
 * real record (enrolment count, room, instructor assignment, document sending)
 * rather than being inferred from the student count.
 */
export interface ClassReadinessMock {
  id: string;
  language: string;
  station: string;
  students: number;
  capacity: number;
  startsIn: number;
  checks: {
    students: boolean;
    location: boolean;
    instructor: boolean;
    materials: boolean;
  };
}

export const classReadiness: ClassReadinessMock[] = [
  {
    id: "1",
    language: "Anglais",
    station: "Courchevel",
    students: 12,
    capacity: 14,
    startsIn: 6,
    checks: { students: true, location: true, instructor: true, materials: true },
  },
  {
    id: "2",
    language: "Espagnol",
    station: "Méribel",
    students: 8,
    capacity: 12,
    startsIn: 11,
    checks: { students: true, location: true, instructor: true, materials: false },
  },
  {
    id: "3",
    language: "Français",
    station: "Val Thorens",
    students: 5,
    capacity: 12,
    startsIn: 18,
    checks: { students: false, location: true, instructor: false, materials: false },
  },
];

export type AlertSeverity = "critical" | "warning" | "info";

export interface AlertMock {
  id: string;
  key: string;
  count: number;
  amount?: number;
  severity: AlertSeverity;
  route: string;
}

/** Exceptions requiring a decision — the dashboard's "what needs me now" list. */
export const alerts: AlertMock[] = [
  {
    id: "1",
    key: "overdueInvoices",
    count: 7,
    amount: 14_820,
    severity: "critical",
    route: "/finance/payments",
  },
  { id: "2", key: "testsToEvaluate", count: 12, severity: "warning", route: "/formateur/evaluations" },
  { id: "3", key: "classesWithoutInstructor", count: 3, severity: "warning", route: "/formation/sessions" },
  { id: "4", key: "contractsExpiring", count: 2, severity: "info", route: "/gestion/partenaires" },
  { id: "5", key: "surveysPending", count: 9, severity: "info", route: "/satisfaction-stats" },
];

export interface ActivityMock {
  id: string;
  key: string;
  actor: string;
  target: string;
  minutesAgo: number;
  accent: string;
}

export const activities: ActivityMock[] = [
  { id: "1", key: "inscriptionCreated", actor: "Sandrine M.", target: "FLI-2026-0148", minutesAgo: 4, accent: "var(--fli-yellow)" },
  { id: "2", key: "invoicePaid", actor: "Système", target: "FA-2026-0092 · 2 310 €", minutesAgo: 27, accent: "var(--fli-teal)" },
  { id: "3", key: "evaluationSubmitted", actor: "Pierre L.", target: "Mathieu Lefèvre", minutesAgo: 68, accent: "var(--fli-blue)" },
  { id: "4", key: "instructorAssigned", actor: "Sandrine M.", target: "Anglais · Courchevel", minutesAgo: 145, accent: "var(--fli-purple)" },
  { id: "5", key: "partnerContractSigned", actor: "Julien R.", target: "ESF Méribel", minutesAgo: 320, accent: "var(--fli-orange)" },
];

export interface TeamMemberMock {
  id: string;
  name: string;
  initials: string;
  roleKey: string;
  load: number;
  accent: string;
  online: boolean;
}

export const team: TeamMemberMock[] = [
  { id: "1", name: "Pierre Lambert", initials: "PL", roleKey: "instructor", load: 92, accent: "var(--fli-blue)", online: true },
  { id: "2", name: "Sandrine Morel", initials: "SM", roleKey: "coordinator", load: 74, accent: "var(--fli-yellow)", online: true },
  { id: "3", name: "Julien Roux", initials: "JR", roleKey: "commercial", load: 61, accent: "var(--fli-teal)", online: false },
  { id: "4", name: "Amélie Girard", initials: "AG", roleKey: "instructor", load: 48, accent: "var(--fli-purple)", online: false },
];

export const satisfaction = {
  score: 4.6,
  max: 5,
  responses: 87,
  delta: 0.3,
};
