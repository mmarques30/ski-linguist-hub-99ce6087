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

// Allowed transitions: key = from, value = array of allowed "to" statuses.
// Depuis « En cours », on autorise aussi les corrections manuelles (retour
// Confirmée, Annulée, Facturée) : un passage erroné à En cours ne doit pas
// obliger à passer par Terminée pour rattraper.
export const STATUS_TRANSITIONS: Record<InscriptionStatus, InscriptionStatus[]> = {
  brouillon: ['en_attente'],
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['en_cours', 'annulee'],
  en_cours: ['terminee', 'confirmee', 'annulee', 'facturee'],
  terminee: ['facturee', 'en_cours', 'annulee'],
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

// Statuts finaux : plus aucune transition n'en part.
export const TERMINAL_STATUSES: InscriptionStatus[] = ['facturee', 'annulee'];

export function isTerminalStatus(status: string): boolean {
  return TERMINAL_STATUSES.includes(status as InscriptionStatus);
}

// Générer le pack de fin est l'acte de clôture : il porte l'inscription à
// « Terminée » depuis n'importe quel statut vivant, sans passage manuel par
// en attente / confirmée / en cours. Le déclencheur
// validate_inscription_status_transition() applique la même règle en base.
export const END_PACK_CLOSABLE_STATUSES: InscriptionStatus[] = [
  'brouillon',
  'en_attente',
  'confirmee',
  'en_cours',
];

export function canCloseWithEndPack(status: string): boolean {
  return END_PACK_CLOSABLE_STATUSES.includes(status as InscriptionStatus);
}

/**
 * Raison, en français, pour laquelle le pack de fin ne peut pas clôturer cette
 * inscription. `null` quand la clôture est possible.
 */
export function endPackBlockedReason(
  status: string,
  endPackSentAt?: string | null
): string | null {
  if (endPackSentAt) {
    return 'Le pack de fin a déjà été généré pour cette inscription : les documents existants sont réutilisés, le statut ne change plus.';
  }
  if (canCloseWithEndPack(status)) return null;
  if (status === 'terminee') {
    return 'Cette inscription est déjà terminée. Générer le pack complétera les documents manquants sans changer le statut.';
  }
  return `Une inscription « ${getStatusLabel(status, 'fr')} » ne peut plus être clôturée : son statut est final.`;
}

/**
 * Phrase française expliquant un refus de transition, alignée sur le message
 * du déclencheur. Sert aussi de garde-fou côté écran, avant l'aller-retour.
 */
export function describeRefusedTransition(from: string, to: string): string {
  const depuis = getStatusLabel(from, 'fr');
  const vers = getStatusLabel(to, 'fr');
  const cibles = getNextStatuses(from);

  if (cibles.length === 0) {
    return `« ${depuis} » est un statut final : l'inscription ne peut plus changer d'état.`;
  }

  const liste = cibles.map((statut) => getStatusLabel(statut, 'fr')).join(', ');
  return `Passage de « ${depuis} » à « ${vers} » impossible. Depuis « ${depuis} », les statuts possibles sont : ${liste}. Le pack de fin de formation, lui, clôture l'inscription quel que soit son statut.`;
}

/**
 * Une formation déjà commencée ne peut plus être annulée depuis « Confirmée » :
 * la base refuse alors confirmée → annulée. Depuis « En cours » ou « Terminée »,
 * l'annulation reste possible (correction / abandon).
 */
export function cancellationBlockedReason(
  status: string,
  startDate: string | null,
  today: string
): string | null {
  if (status !== 'confirmee') return null;
  if (!startDate || startDate > today) return null;
  return `La formation a débuté le ${startDate} : l'annulation n'est plus possible depuis « Confirmée ». Passez d'abord à « En cours » si vous devez annuler.`;
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
