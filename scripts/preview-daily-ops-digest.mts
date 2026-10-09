import { writeFileSync } from "node:fs";
import {
  buildDailyOpsDigest,
  formatDailyOpsDigestSubject,
  formatDailyOpsDigestText,
  type DigestInscriptionRow,
} from "../src/lib/daily-ops-digest.ts";

/** Snapshot pour prévisualisation — remplacer par appel edge en prod. */
const rows: DigestInscriptionRow[] = [
  { id: "39", code: "FLI-260039", status: "en_attente", created_at: "2026-10-08T20:43:43Z", start_date: "2026-11-30", end_date: "2026-12-11", course_location: "ESF La Rosière", modality: "presentiel", language: "Portugais", funding_organization: "FIFPL", payment_method: "cheque_fifpl_ecole", price: 1500, deposit_amount: null, balance_after_deposit: 1500, documents_sent_at: "2026-10-09T09:58:07Z", first_name: "MAUD", last_name: "GOBERT", email: "gobert-maud@orange.fr", amount_received: 0, deposit_received: 0, amount_pending: 1500, cheque_pending: 1500 },
  { id: "37", code: "FLI-260037", status: "en_attente", created_at: "2026-10-08T12:51:46Z", start_date: "2026-10-13", end_date: "2027-04-13", course_location: "En ligne", modality: "en_ligne_individuel", language: "Russe", funding_organization: "FIFPL", payment_method: "cheque", price: 900, deposit_amount: 150, balance_after_deposit: 750, documents_sent_at: "2026-10-08T13:28:09Z", first_name: "Nathalie", last_name: "BOUVIER", email: "natbouvier@wanadoo.fr", amount_received: 150, deposit_received: 150, amount_pending: 750, cheque_pending: 750 },
  { id: "36", code: "FLI-260036", status: "en_attente", created_at: "2026-10-08T08:55:28Z", start_date: "2026-11-03", end_date: "2026-11-26", course_location: "En ligne", modality: "en_ligne_groupe", language: "Russe", funding_organization: "FIFPL", payment_method: "cheque", price: 900, deposit_amount: 150, balance_after_deposit: 750, documents_sent_at: "2026-10-09T09:55:30Z", first_name: "Tristan", last_name: "Ruffier Lanche", email: "tristan.ruffier.lanche@gmail.com", amount_received: 150, deposit_received: 150, amount_pending: 0, cheque_pending: 0 },
  { id: "27", code: "FLI-260027", status: "en_attente", created_at: "2026-10-05T17:49:55Z", start_date: "2026-11-30", end_date: "2026-12-11", course_location: "ESF La Rosière", modality: "presentiel", language: "Portugais", funding_organization: "FIFPL", payment_method: "cheque_fifpl_ecole", price: 1500, deposit_amount: null, balance_after_deposit: 900, documents_sent_at: null, first_name: "Christelle", last_name: "Gaidet", email: "chrisg73@orange.fr", amount_received: 0, deposit_received: 0, amount_pending: 1500, cheque_pending: 1500 },
  { id: "25", code: "FLI-260025", status: "en_attente", created_at: "2026-10-05T11:41:33Z", start_date: "2026-11-30", end_date: "2026-12-11", course_location: "ESF La Rosière", modality: "presentiel", language: "Portugais", funding_organization: "Entreprise", payment_method: "cheque_fifpl_ecole", price: 1500, deposit_amount: null, balance_after_deposit: 1500, documents_sent_at: null, first_name: "Matthieu", last_name: "Cauchois", email: "cauchois.matthieu@gmail.com", amount_received: 0, deposit_received: 0, amount_pending: 1500, cheque_pending: 1500 },
  { id: "23", code: "FLI-260023", status: "confirmee", created_at: "2026-10-05T08:36:51Z", start_date: "2026-11-30", end_date: "2026-12-11", course_location: "ESF La Rosière", modality: "presentiel", language: "Portugais", funding_organization: "Entreprise", payment_method: "cheque_fifpl_ecole", price: 1500, deposit_amount: null, balance_after_deposit: 180, documents_sent_at: null, first_name: "LIONEL", last_name: "LAPORTE", email: "liopuerta@yahoo.fr", amount_received: 0, deposit_received: 0, amount_pending: 1500, cheque_pending: 1500 },
  { id: "22", code: "FLI-260022", status: "en_attente", created_at: "2026-10-02T11:17:23Z", start_date: "2026-10-12", end_date: "2027-03-31", course_location: "Google Meet", modality: "en_ligne", language: "Russe", funding_organization: "FIFPL", payment_method: null, price: 600, deposit_amount: 150, balance_after_deposit: 450, documents_sent_at: "2026-10-08T17:27:03Z", first_name: "Michael", last_name: "colonna cesari", email: "colonna.michael@hotmail.fr", amount_received: 150, deposit_received: 150, amount_pending: 0, cheque_pending: 0 },
  { id: "21", code: "FLI-260021", status: "en_attente", created_at: "2026-10-02T11:17:23Z", start_date: "2026-10-12", end_date: "2026-12-20", course_location: "Google Meet", modality: "en_ligne", language: "Italien", funding_organization: "FIFPL", payment_method: null, price: 600, deposit_amount: 150, balance_after_deposit: 450, documents_sent_at: "2026-10-06T12:11:14Z", first_name: "Didier", last_name: "Angelloz Nicoud", email: "angellozdid@sfr.fr", amount_received: 0, deposit_received: 0, amount_pending: 150, cheque_pending: 0 },
  { id: "20", code: "FLI-260020", status: "confirmee", created_at: "2026-10-01T16:25:15Z", start_date: "2026-11-30", end_date: "2026-12-04", course_location: "Brides-les-Bains", modality: "presentiel", language: "Russe", funding_organization: "AGEFICE", payment_method: "stripe", price: 950, deposit_amount: 150, balance_after_deposit: 800, documents_sent_at: "2026-10-02T08:36:19Z", first_name: "Marc", last_name: "Testut", email: "marc.testut@gmail.com", amount_received: 150, deposit_received: 150, amount_pending: 800, cheque_pending: 800 },
];

const digest = buildDailyOpsDigest(rows, new Date("2026-10-09T10:15:00Z"));
const subject = formatDailyOpsDigestSubject(digest);
const text = formatDailyOpsDigestText(digest);
writeFileSync("/opt/cursor/artifacts/daily-ops-digest-sample.txt", `${subject}\n\n${text}\n`);
console.log(subject);
console.log("");
console.log(text);
