export type FormateurInscriptionRow = {
  id: string;
  code: string | null;
  language: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  student_id: string | null;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  course_location: string | null;
  course_address: string | null;
  modality: string | null;
  rhythm: string | null;
  schedule: string | null;
  group_name: string | null;
  ski_school_name: string | null;
};

export function splitFormateurInscriptions(rows: FormateurInscriptionRow[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming: FormateurInscriptionRow[] = [];
  const current: FormateurInscriptionRow[] = [];
  const past: FormateurInscriptionRow[] = [];

  for (const row of rows) {
    const start = row.start_date ? new Date(row.start_date) : null;
    const end = row.end_date ? new Date(row.end_date) : start;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    if (end && end < today) {
      past.push(row);
    } else if (start && start > today) {
      upcoming.push(row);
    } else {
      current.push(row);
    }
  }

  upcoming.sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
  current.sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));

  return { upcoming, current, past };
}

export function uniqueStagiairesFromInscriptions(rows: FormateurInscriptionRow[]) {
  const byStudent = new Map<
    string,
    {
      studentId: string;
      name: string;
      email: string | null;
      phone: string | null;
      inscriptions: FormateurInscriptionRow[];
    }
  >();

  for (const row of rows) {
    const key = row.student_id || `anon:${row.id}`;
    const existing = byStudent.get(key);
    if (existing) {
      existing.inscriptions.push(row);
      continue;
    }
    byStudent.set(key, {
      studentId: key,
      name: row.student_name?.trim() || "Stagiaire",
      email: row.student_email,
      phone: row.student_phone,
      inscriptions: [row],
    });
  }

  return [...byStudent.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}
