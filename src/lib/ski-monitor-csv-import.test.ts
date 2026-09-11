import { describe, it, expect } from "vitest";
import { parseSkiMonitorCsv } from "./ski-monitor-csv-import";

// Jeux d'essai fictifs uniquement : noms préfixés « Zz » et domaine réservé
// `example.invalid`. Ne jamais coller ici un extrait d'une liste réelle.

describe("parseSkiMonitorCsv", () => {
  it("parses FLI listing format and deduplicates by email", () => {
    const csv = `liste;Name;Email Address;Date Status Changed;Date Joined;Permission to Track;Status;ESF;Nom;Prénom;station
2024;Zzactive Anne;zzactive.anne@example.invalid;2024-10-27;2024-10-27;;Active;;;;;
2024;Zzdesabo Bruno;zzdesabo.bruno@example.invalid;2024-11-04;2024-10-27;;Unsubscribed;;;;;
2024;Zzdoublon Chloe;zzdoublon@example.invalid;2024-10-27;2024-10-27;;Active;;;;;
ContactsFLI2018;Zzdoublon Ancien;zzdoublon@example.invalid;2017-05-16;2017-05-16;;Unsubscribed;Chamrousse;ZZDOUBLON;Chloe;;`;

    const result = parseSkiMonitorCsv(csv);
    expect(result.totalRows).toBe(4);
    expect(result.uniqueEmails).toBe(3);
    expect(result.active).toBe(2);

    const dup = result.rows.find((r) => r.email === "zzdoublon@example.invalid");
    expect(dup?.status).toBe("active");
    expect(dup?.home_station).toBe("Chamrousse");

    const active = result.rows.find(
      (r) => r.email === "zzactive.anne@example.invalid"
    );
    expect(active?.first_name).toBe("Anne");
    expect(active?.last_name).toBe("Zzactive");
  });

  it("maps bounced and unsubscribed to unsubscribed", () => {
    const csv = `liste;Name;Email Address;Status
2024;Zzrebond Test;zzrebond@example.invalid;Bounced
2024;Zzunsub Test;zzunsub@example.invalid;Unsubscribed`;

    const result = parseSkiMonitorCsv(csv);
    expect(result.unsubscribed).toBe(2);
    expect(result.active).toBe(0);
  });
});
