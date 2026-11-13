import { describe, expect, it } from 'vitest';
import {
  SCHEDULE_NO_LOCATION_LABEL,
  SCHEDULE_OUT_OF_SCOPE_STATUSES,
  addDaysKey,
  daysBetween,
  groupPendingSchedules,
  scheduleDeadline,
  scheduleGroupTitle,
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
    { id: 'a', start_date: '2026-09-18', language: 'Anglais', course_location: "ESF Val d'Isère" },
    { id: 'b', start_date: '2026-09-18', language: 'Anglais', course_location: "ESF Val d'Isère" },
    { id: 'c', start_date: '2026-09-18', language: 'Italien', course_location: "ESF Val d'Isère" },
    { id: 'd', start_date: '2026-09-20', language: 'Anglais', course_location: "ESF Val d'Isère" },
    { id: 'e', start_date: '2024-07-18', language: 'Anglais', course_location: "ESF Val d'Isère" },
  ];

  it('groupe par date de début, langue et lieu', () => {
    const groupes = groupPendingSchedules(rows, '2026-09-15');
    const anglais18 = groupes.find(
      (g) =>
        g.startDate === '2026-09-18' &&
        g.language === 'Anglais' &&
        g.location === "ESF Val d'Isère"
    );
    expect(anglais18?.inscriptions.map((i) => i.id)).toEqual(['a', 'b']);
    expect(groupes).toHaveLength(4);
  });

  it('sépare Val d’Isère et Sainte-Foy à mêmes dates / langue', () => {
    const groupes = groupPendingSchedules(
      [
        {
          id: 'theo',
          start_date: '2026-11-23',
          language: 'Portugais brésilien',
          course_location: "ESF Val d'Isère",
        },
        {
          id: 'carole',
          start_date: '2026-11-23',
          language: 'Portugais brésilien',
          course_location: 'Sainte-Foy-Tarentaise',
        },
      ],
      '2026-11-13'
    );
    expect(groupes).toHaveLength(2);
    expect(groupes.map((g) => g.location).sort()).toEqual([
      "ESF Val d'Isère",
      'Sainte-Foy-Tarentaise',
    ]);
  });

  it('unifie Portugais et Portugais brésilien dans le même groupe (même lieu)', () => {
    const groupes = groupPendingSchedules(
      [
        {
          id: 'theo',
          start_date: '2026-11-23',
          language: 'Portugais',
          course_location: "ESF Val d'Isère",
        },
        {
          id: 'julie',
          start_date: '2026-11-23',
          language: 'Portugais brésilien',
          course_location: "ESF Val d'Isère",
        },
      ],
      '2026-11-13'
    );
    expect(groupes).toHaveLength(1);
    expect(groupes[0].language).toBe('Portugais brésilien');
    expect(groupes[0].inscriptions.map((i) => i.id).sort()).toEqual(['julie', 'theo']);
  });

  it('étiquette Sans lieu quand course_location est vide', () => {
    const groupes = groupPendingSchedules(
      [{ id: 'x', start_date: '2026-11-23', language: 'Anglais', course_location: null }],
      '2026-11-13'
    );
    expect(groupes[0].location).toBe(SCHEDULE_NO_LOCATION_LABEL);
  });

  it('remonte les retards en premier', () => {
    const groupes = groupPendingSchedules(rows, '2026-09-15');
    expect(groupes[0].startDate).toBe('2024-07-18');
    expect(groupes[0].deadline.late).toBe(true);
    expect(groupes.slice(1).every((g) => !g.deadline.late)).toBe(true);
  });

  it('classe ensuite par date, lieu, puis langue', () => {
    const groupes = groupPendingSchedules(rows, '2026-09-15').slice(1);
    expect(groupes.map((g) => scheduleGroupTitle(g))).toEqual([
      "ESF Val d'Isère · Anglais",
      "ESF Val d'Isère · Italien",
      "ESF Val d'Isère · Anglais",
    ]);
    expect(groupes.map((g) => g.startDate)).toEqual([
      '2026-09-18',
      '2026-09-18',
      '2026-09-20',
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
