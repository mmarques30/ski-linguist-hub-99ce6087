import { describe, it, expect } from "vitest";
import { parseSkiMonitorCsv } from "./ski-monitor-csv-import";

describe("parseSkiMonitorCsv", () => {
  it("parses FLI listing format and deduplicates by email", () => {
    const csv = `liste;Name;Email Address;Date Status Changed;Date Joined;Permission to Track;Status;ESF;Nom;Prénom;station
2024;Aurange Emilie;emilie.aurange@gmail.com;2024-10-27;2024-10-27;;Active;;;;;
2024;Bouvier Laurent;lbouvier.electricite@gmail.com;2024-11-04;2024-10-27;;Unsubscribed;;;;;
2024;Dup Test;dup@test.fr;2024-10-27;2024-10-27;;Active;;;;;
ContactsFLI2018;Dup Test Old;dup@test.fr;2017-05-16;2017-05-16;;Unsubscribed;Chamrousse;DUP;Jean;;`;

    const result = parseSkiMonitorCsv(csv);
    expect(result.totalRows).toBe(4);
    expect(result.uniqueEmails).toBe(3);
    expect(result.active).toBe(2);

    const dup = result.rows.find((r) => r.email === "dup@test.fr");
    expect(dup?.status).toBe("active");
    expect(dup?.home_station).toBe("Chamrousse");

    const emilie = result.rows.find((r) => r.email === "emilie.aurange@gmail.com");
    expect(emilie?.first_name).toBe("Emilie");
    expect(emilie?.last_name).toBe("Aurange");
  });

  it("maps bounced and unsubscribed to unsubscribed", () => {
    const csv = `liste;Name;Email Address;Status
2024;Test Bounce;b@x.fr;Bounced
2024;Test Unsub;u@x.fr;Unsubscribed`;

    const result = parseSkiMonitorCsv(csv);
    expect(result.unsubscribed).toBe(2);
    expect(result.active).toBe(0);
  });
});
