import { describe, expect, it } from 'vitest';
import {
  INSCRIPTION_STATUSES,
  STATUS_TRANSITIONS,
  TERMINAL_STATUSES,
  canCloseWithEndPack,
  canTransition,
  cancellationBlockedReason,
  describeRefusedTransition,
  endPackBlockedReason,
  getNextStatuses,
  isTerminalStatus,
} from '@/lib/inscription-status';

describe('matrice de transitions', () => {
  it('couvre les sept statuts', () => {
    expect(Object.keys(STATUS_TRANSITIONS).sort()).toEqual(
      Object.values(INSCRIPTION_STATUSES).sort()
    );
  });

  it('reproduit la matrice du déclencheur SQL', () => {
    // Doit rester aligné sur validate_inscription_status_transition().
    expect(canTransition('brouillon', 'en_attente')).toBe(true);
    expect(canTransition('en_attente', 'confirmee')).toBe(true);
    expect(canTransition('en_attente', 'annulee')).toBe(true);
    expect(canTransition('confirmee', 'en_cours')).toBe(true);
    expect(canTransition('confirmee', 'annulee')).toBe(true);
    expect(canTransition('en_cours', 'terminee')).toBe(true);
    expect(canTransition('terminee', 'facturee')).toBe(true);
  });

  it('refuse les raccourcis, dont celui qui bloquait le pack de fin', () => {
    expect(canTransition('brouillon', 'terminee')).toBe(false);
    expect(canTransition('brouillon', 'en_cours')).toBe(false);
    expect(canTransition('en_attente', 'en_cours')).toBe(false);
    expect(canTransition('confirmee', 'terminee')).toBe(false);
  });

  it('traite facturée et annulée comme des statuts finaux', () => {
    for (const statut of TERMINAL_STATUSES) {
      expect(getNextStatuses(statut)).toEqual([]);
      expect(isTerminalStatus(statut)).toBe(true);
    }
    expect(isTerminalStatus('en_cours')).toBe(false);
  });

  it('ignore un statut inconnu sans lever', () => {
    expect(getNextStatuses('inconnu')).toEqual([]);
    expect(canTransition('inconnu', 'terminee')).toBe(false);
  });
});

describe('clôture par le pack de fin', () => {
  it('clôture depuis les quatre statuts vivants', () => {
    for (const statut of ['brouillon', 'en_attente', 'confirmee', 'en_cours']) {
      expect(canCloseWithEndPack(statut)).toBe(true);
      expect(endPackBlockedReason(statut, null)).toBeNull();
    }
  });

  it('refuse un statut final et le dit en français', () => {
    expect(canCloseWithEndPack('facturee')).toBe(false);
    expect(endPackBlockedReason('facturee', null)).toContain('Facturée');
    expect(endPackBlockedReason('facturee', null)).toContain('statut est final');
    expect(endPackBlockedReason('annulee', null)).toContain('Annulée');
  });

  it('signale une inscription déjà terminée sans bloquer les documents', () => {
    expect(endPackBlockedReason('terminee', null)).toContain('déjà terminée');
  });

  it('signale un pack déjà généré', () => {
    const raison = endPackBlockedReason('terminee', '2026-09-15T10:00:00Z');
    expect(raison).toContain('déjà été généré');
  });
});

describe('messages de refus', () => {
  it('énumère les cibles possibles depuis le statut courant', () => {
    const message = describeRefusedTransition('brouillon', 'terminee');
    expect(message).toContain('« Brouillon »');
    expect(message).toContain('« Terminée »');
    expect(message).toContain('En attente');
    expect(message).toContain('pack de fin');
  });

  it('dit simplement « statut final » quand aucune cible n’existe', () => {
    const message = describeRefusedTransition('facturee', 'terminee');
    expect(message).toContain('statut final');
    expect(message).not.toContain('les statuts possibles');
  });

  it('ne contient aucun identifiant technique', () => {
    const message = describeRefusedTransition('confirmee', 'facturee');
    expect(message).not.toMatch(/brouillon|en_attente|en_cours|terminee|facturee/);
  });
});

describe('annulation d’une formation commencée', () => {
  it('bloque quand la date de début est atteinte', () => {
    expect(cancellationBlockedReason('confirmee', '2026-09-10', '2026-09-15')).toContain(
      '2026-09-10'
    );
    expect(cancellationBlockedReason('confirmee', '2026-09-15', '2026-09-15')).not.toBeNull();
  });

  it('laisse passer une formation à venir', () => {
    expect(cancellationBlockedReason('confirmee', '2026-09-20', '2026-09-15')).toBeNull();
  });

  it('ne dit rien pour les autres statuts', () => {
    expect(cancellationBlockedReason('en_attente', '2026-01-01', '2026-09-15')).toBeNull();
  });
});
