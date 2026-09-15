import { describe, expect, it } from 'vitest';
import {
  SCHEDULE_OUT_OF_SCOPE_STATUSES,
  addDaysKey,
  daysBetween,
  groupPendingSchedules,
  scheduleDeadline,
  scheduleHorizonKey,
  todayKey,
} from '@/lib/schedule-validation';

describe('clés de date', () => {
  it('rend la date locale, sans décalage de veille', () => {
    // 22 h heure de Paris = encore le même jour côté utilisateur.
    expect(todayKey(new Date('2026-09-15T20:00:00Z'))).toBe('2026-09-15');
  });

  it('avance et recule sans dériver au changement de mois', () => {
    expect(addDaysKey('2026-09-25', 10)).toBe('2026-10-05');
    expect(addDaysKey('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('fixe l’horizon à J+10', () => {
    expect(scheduleHorizonKey('2026-09-15')).toBe('2026-09-25');
  });

  it('compte les jours dans les deux sens', () => {
    expect(daysBetween('2026-09-15', '2026-09-18')).toBe(3);
    expect(daysBetween('2026-09-15', '2026-09-14')).toBe(-1);
    expect(daysBetween('2026-09-15', '2026-09-15')).toBe(0);
  });

  it('renvoie 0 sur une date illisible plutôt que NaN', () => {
    expect(daysBetween('2026-09-15', 'jamais')).toBe(0);
  });
});

describe('échéance affichée', () => {
  it('nomme les cas proches', () => {
    expect(scheduleDeadline('2026-09-15', '2026-09-15').label).toBe("Commence aujourd'hui");
    expect(scheduleDeadline('2026-09-16', '2026-09-15').label).toBe('Commence demain');
    expect(scheduleDeadline('2026-09-18', '2026-09-15').label).toBe('Commence dans 3 jours');
  });

  it('marque le retard, singulier compris', () => {
    const veille = scheduleDeadline('2026-09-14', '2026-09-15');
    expect(veille.late).toBe(true);
    expect(veille.label).toBe('Commencée depuis 1 jour');

    const ancien = scheduleDeadline('2024-07-18', '2026-09-15');
    expect(ancien.late).toBe(true);
    expect(ancien.label).toBe('Commencée depuis 789 jours');
  });

  it('ne considère pas le jour même comme un retard', () => {
    expect(scheduleDeadline('2026-09-15', '2026-09-15').late).toBe(false);
  });
});

describe('regroupement', () => {
  const rows = [
    { id: 'a', start_date: '2026-09-18', language: 'Anglais' },
    { id: 'b', start_date: '2026-09-18', language: 'Anglais' },
    { id: 'c', start_date: '2026-09-18', language: 'Italien' },
    { id: 'd', start_date: '2026-09-20', language: 'Anglais' },
    { id: 'e', start_date: '2024-07-18', language: 'Anglais' },
  ];

  it('groupe par date de début et langue', () => {
    const groupes = groupPendingSchedules(rows, '2026-09-15');
    const anglais18 = groupes.find(
      (g) => g.startDate === '2026-09-18' && g.language === 'Anglais'
    );
    expect(anglais18?.inscriptions.map((i) => i.id)).toEqual(['a', 'b']);
    expect(groupes).toHaveLength(4);
  });

  it('remonte les retards en premier', () => {
    const groupes = groupPendingSchedules(rows, '2026-09-15');
    expect(groupes[0].startDate).toBe('2024-07-18');
    expect(groupes[0].deadline.late).toBe(true);
    expect(groupes.slice(1).every((g) => !g.deadline.late)).toBe(true);
  });

  it('classe ensuite par date puis par langue', () => {
    const groupes = groupPendingSchedules(rows, '2026-09-15').slice(1);
    expect(groupes.map((g) => `${g.startDate} ${g.language}`)).toEqual([
      '2026-09-18 Anglais',
      '2026-09-18 Italien',
      '2026-09-20 Anglais',
    ]);
  });

  it('accepte une liste vide', () => {
    expect(groupPendingSchedules([], '2026-09-15')).toEqual([]);
  });
});

describe('périmètre', () => {
  it('exclut du flux J-10 les inscriptions dont le cycle est clos', () => {
    expect(SCHEDULE_OUT_OF_SCOPE_STATUSES).toEqual(['terminee', 'facturee', 'annulee']);
    expect(SCHEDULE_OUT_OF_SCOPE_STATUSES).not.toContain('brouillon');
    expect(SCHEDULE_OUT_OF_SCOPE_STATUSES).not.toContain('en_cours');
  });
});
