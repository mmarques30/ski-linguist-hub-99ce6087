// Inscription Status Machine
// Statuts et transitions autorisées pour les inscriptions

export const INSCRIPTION_STATUSES = {
  BROUILLON: 'brouillon',
  EN_ATTENTE: 'en_attente',
  CONFIRMEE: 'confirmee',
  EN_COURS: 'en_cours',
  TERMINEE: 'terminee',
  FACTUREE: 'facturee',
  ANNULEE: 'annulee',
} as const;

export type InscriptionStatus = typeof INSCRIPTION_STATUSES[keyof typeof INSCRIPTION_STATUSES];

// Allowed transitions: key = from, value = array of allowed "to" statuses
export const STATUS_TRANSITIONS: Record<InscriptionStatus, InscriptionStatus[]> = {
  brouillon: ['en_attente'],
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['en_cours', 'annulee'],
  en_cours: ['terminee'],
  terminee: ['facturee'],
  facturee: [],
  annulee: [],
};

export function canTransition(from: string, to: string): boolean {
  const allowed = STATUS_TRANSITIONS[from as InscriptionStatus];
  return allowed?.includes(to as InscriptionStatus) ?? false;
}

export function getNextStatuses(current: string): InscriptionStatus[] {
  return STATUS_TRANSITIONS[current as InscriptionStatus] ?? [];
}

// Translated labels for each status
export const STATUS_LABELS: Record<InscriptionStatus, { fr: string; 'pt-BR': string; en: string }> = {
  brouillon: { fr: 'Brouillon', 'pt-BR': 'Rascunho', en: 'Draft' },
  en_attente: { fr: 'En attente', 'pt-BR': 'Pendente', en: 'Pending' },
  confirmee: { fr: 'Confirmée', 'pt-BR': 'Confirmada', en: 'Confirmed' },
  en_cours: { fr: 'En cours', 'pt-BR': 'Em andamento', en: 'In Progress' },
  terminee: { fr: 'Terminée', 'pt-BR': 'Concluída', en: 'Completed' },
  facturee: { fr: 'Facturée', 'pt-BR': 'Faturada', en: 'Billed' },
  annulee: { fr: 'Annulée', 'pt-BR': 'Cancelada', en: 'Cancelled' },
};

// Badge styles for each status
export const STATUS_STYLES: Record<InscriptionStatus, string> = {
  brouillon: 'bg-gray-100 text-gray-800',
  en_attente: 'bg-yellow-100 text-yellow-800',
  confirmee: 'bg-blue-100 text-blue-800',
  en_cours: 'bg-indigo-100 text-indigo-800',
  terminee: 'bg-gray-100 text-gray-800',
  facturee: 'bg-emerald-100 text-emerald-800',
  annulee: 'bg-red-100 text-red-800',
};

// Icons mapping (lucide icon names)
export const STATUS_ICONS = {
  brouillon: 'FileEdit',
  en_attente: 'Clock',
  confirmee: 'CheckCircle',
  en_cours: 'Play',
  terminee: 'CheckCircle2',
  facturee: 'Receipt',
  annulee: 'XCircle',
} as const;

// Helper to get label for current UI language
export function getStatusLabel(status: string, lang: 'fr' | 'pt-BR' | 'en'): string {
  return STATUS_LABELS[status as InscriptionStatus]?.[lang] ?? status;
}

// Helper to get style for a status
export function getStatusStyle(status: string): string {
  return STATUS_STYLES[status as InscriptionStatus] ?? 'bg-gray-100 text-gray-800';
}

// All statuses for filter dropdowns (excluding brouillon which is internal)
export const FILTER_STATUSES: InscriptionStatus[] = [
  'en_attente', 'confirmee', 'en_cours', 'terminee', 'facturee', 'annulee'
];

// "Active" statuses (for counting active formations)
export const ACTIVE_STATUSES: InscriptionStatus[] = ['en_cours'];

// "Confirmed" statuses (for KPI counting)
export const CONFIRMED_STATUSES: InscriptionStatus[] = ['confirmee', 'en_cours', 'facturee'];

// "Completed" statuses
export const COMPLETED_STATUSES: InscriptionStatus[] = ['terminee', 'facturee'];
