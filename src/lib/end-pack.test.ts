import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  describeEndPackRollback,
  generateEndPack,
  resolveEndPackDeposit,
  type EndPackCloseFields,
  type EndPackInput,
  type EndPackStore,
} from "./end-pack";

type FailAt = keyof Pick<
  EndPackStore,
  | "insertInvoice"
  | "insertCertificate"
  | "uploadCertificatePdf"
  | "insertDocumentSending"
  | "insertSurvey"
  | "closeInscription"
>;

type MemoryInvoice = { id: string; invoice_number: string | null; inscription_id: string };
type MemoryCertificate = { id: string; inscription_id: string; pdf_url: string | null };
type MemorySurvey = { id: string; token: string; inscription_id: string };
type MemorySending = { id: string; inscription_id: string };
type MemoryInscription = {
  id: string;
  price: number | null;
  deposit_amount: number | null;
  balance_after_deposit: number | null;
  status: string;
  end_pack_sent_at: string | null;
};

function input(overrides: Partial<EndPackInput> = {}): EndPackInput {
  return {
    inscriptionId: "ins-1",
    studentId: "stu-1",
    studentName: "Stagiaire",
    language: "anglais",
    startDate: "2026-01-12",
    endDate: "2026-01-16",
    durationHours: 20,
    hoursFollowed: 20,
    courseLocation: "Les Arcs",
    modality: "présentiel",
    formateurName: "Formateur",
    code: "INS-TEST",
    niveauGeneralEntree: "A2",
    niveauTechniqueEntree: "A2",
    niveauGeneralSortie: "B1",
    niveauTechniqueSortie: "B1",
    objectifAtteint: "oui",
    commentaireSortie: "Objectif atteint.",
    attendanceRate: 100,
    generateInvoice: true,
    generateCertificate: true,
    sendSurvey: true,
    certificatePdfBlob: new Blob(["pdf"], { type: "application/pdf" }),
    ...overrides,
  };
}

function createMemoryStore(options?: {
  failAt?: FailAt;
  seed?: {
    invoices?: MemoryInvoice[];
    certificates?: MemoryCertificate[];
    surveys?: MemorySurvey[];
  };
}) {
  const calls: string[] = [];
  let nextId = 1;
  const invoices: MemoryInvoice[] = [...(options?.seed?.invoices ?? [])];
  const certificates: MemoryCertificate[] = [...(options?.seed?.certificates ?? [])];
  const surveys: MemorySurvey[] = [...(options?.seed?.surveys ?? [])];
  const sendings: MemorySending[] = [];
  const pdfs = new Set<string>();
  const inscription: MemoryInscription = {
    id: "ins-1",
    price: 1200,
    deposit_amount: 150,
    balance_after_deposit: 1050,
    status: "en_cours",
    end_pack_sent_at: null,
  };

  const fail = (name: FailAt) => {
    if (options?.failAt === name) {
      throw new Error(`échec simulé : ${name}`);
    }
  };

  const store: EndPackStore = {
    async findExistingInvoice(inscriptionId) {
      calls.push("findExistingInvoice");
      return invoices.find((row) => row.inscription_id === inscriptionId) ?? null;
    },
    async getInscriptionAmounts() {
      calls.push("getInscriptionAmounts");
      return {
        price: inscription.price,
        deposit_amount: inscription.deposit_amount,
        balance_after_deposit: inscription.balance_after_deposit,
      };
    },
    async insertInvoice(row) {
      calls.push("insertInvoice");
      fail("insertInvoice");
      const created = {
        id: `inv-${nextId++}`,
        invoice_number: `26-27.${14000 + nextId}`,
        inscription_id: row.inscription_id,
      };
      invoices.push(created);
      return created;
    },
    async findExistingCertificate(inscriptionId) {
      calls.push("findExistingCertificate");
      return certificates.find((row) => row.inscription_id === inscriptionId) ?? null;
    },
    async insertCertificate(row) {
      calls.push("insertCertificate");
      fail("insertCertificate");
      const created = {
        id: `cer-${nextId++}`,
        inscription_id: row.inscription_id,
        pdf_url: null as string | null,
      };
      certificates.push(created);
      return { id: created.id };
    },
    async updateCertificatePdfUrl(id, path) {
      calls.push("updateCertificatePdfUrl");
      const row = certificates.find((item) => item.id === id);
      if (row) row.pdf_url = path;
    },
    async insertDocumentSending(row) {
      calls.push("insertDocumentSending");
      fail("insertDocumentSending");
      const created = { id: `snd-${nextId++}`, inscription_id: row.inscription_id };
      sendings.push(created);
      return created;
    },
    async uploadCertificatePdf(path) {
      calls.push("uploadCertificatePdf");
      fail("uploadCertificatePdf");
      pdfs.add(path);
    },
    async findExistingSurvey(inscriptionId) {
      calls.push("findExistingSurvey");
      return surveys.find((row) => row.inscription_id === inscriptionId) ?? null;
    },
    async insertSurvey(row) {
      calls.push("insertSurvey");
      fail("insertSurvey");
      const created = {
        id: `srv-${nextId++}`,
        token: `tok-${nextId}`,
        inscription_id: row.inscription_id,
      };
      surveys.push(created);
      return created;
    },
    async closeInscription(inscriptionId, fields: EndPackCloseFields) {
      calls.push("closeInscription");
      fail("closeInscription");
      if (inscription.id !== inscriptionId) return;
      inscription.status = fields.status;
      inscription.end_pack_sent_at = fields.end_pack_sent_at;
    },
    async deleteInvoice(id) {
      calls.push("deleteInvoice");
      const index = invoices.findIndex((row) => row.id === id);
      if (index >= 0) invoices.splice(index, 1);
    },
    async deleteCertificate(id) {
      calls.push("deleteCertificate");
      const index = certificates.findIndex((row) => row.id === id);
      if (index >= 0) certificates.splice(index, 1);
    },
    async deleteDocumentSending(id) {
      calls.push("deleteDocumentSending");
      const index = sendings.findIndex((row) => row.id === id);
      if (index >= 0) sendings.splice(index, 1);
    },
    async deleteSurvey(id) {
      calls.push("deleteSurvey");
      const index = surveys.findIndex((row) => row.id === id);
      if (index >= 0) surveys.splice(index, 1);
    },
    async removeCertificatePdf(path) {
      calls.push("removeCertificatePdf");
      pdfs.delete(path);
    },
  };

  return { store, calls, invoices, certificates, surveys, sendings, pdfs, inscription };
}

describe("describeEndPackRollback", () => {
  it("rédige un message français sans données personnelles", () => {
    const message = describeEndPackRollback({
      step: "certificate",
      cause: "échec simulé : insertCertificate",
      rolledBack: ["facture brouillon"],
      rollbackFailures: [],
    });
    expect(message).toContain("Pack de fin interrompu à l'étape « certificat »");
    expect(message).toContain("n'est pas passée à « Terminée »");
    expect(message).toContain("Annulé : facture brouillon");
    expect(message).not.toMatch(/[A-Z][a-z]+ [A-Z][a-z]+/);
  });
});

describe("generateEndPack — ordre et compensation", () => {
  it("crée facture, certificat et enquête avant de passer à Terminée", async () => {
    const memory = createMemoryStore();
    const result = await generateEndPack(memory.store, input());

    expect(result.invoiceId).toBeTruthy();
    expect(result.certificateId).toBeTruthy();
    expect(result.surveyToken).toBeTruthy();
    expect(memory.inscription.status).toBe("terminee");
    expect(memory.inscription.end_pack_sent_at).toBeTruthy();

    const mutations = memory.calls.filter((name) =>
      [
        "insertInvoice",
        "insertCertificate",
        "uploadCertificatePdf",
        "insertDocumentSending",
        "insertSurvey",
        "closeInscription",
      ].includes(name)
    );
    expect(mutations).toEqual([
      "insertInvoice",
      "insertCertificate",
      "uploadCertificatePdf",
      "insertDocumentSending",
      "insertSurvey",
      "closeInscription",
    ]);
  });

  it("annule la facture créée et ne clôture pas si le certificat échoue", async () => {
    const memory = createMemoryStore({ failAt: "insertCertificate" });

    await expect(generateEndPack(memory.store, input())).rejects.toThrow(
      /étape « certificat »[\s\S]*n'est pas passée à « Terminée »[\s\S]*Annulé : facture brouillon/
    );

    expect(memory.invoices).toHaveLength(0);
    expect(memory.certificates).toHaveLength(0);
    expect(memory.surveys).toHaveLength(0);
    expect(memory.inscription.status).toBe("en_cours");
    expect(memory.inscription.end_pack_sent_at).toBeNull();
    expect(memory.calls).not.toContain("closeInscription");
    expect(memory.calls).toContain("deleteInvoice");
  });

  it("annule facture, certificat et PDF si l'enquête échoue", async () => {
    const memory = createMemoryStore({ failAt: "insertSurvey" });

    const rejection = await generateEndPack(memory.store, input()).then(
      () => {
        throw new Error("aurait dû échouer");
      },
      (error: Error) => error.message
    );

    expect(rejection).toContain("étape « enquête de satisfaction »");
    expect(rejection).toContain("n'est pas passée à « Terminée »");
    expect(rejection).toContain("facture brouillon");
    expect(rejection).toContain("certificat");
    expect(memory.invoices).toHaveLength(0);
    expect(memory.certificates).toHaveLength(0);
    expect(memory.surveys).toHaveLength(0);
    expect(memory.sendings).toHaveLength(0);
    expect(memory.pdfs.size).toBe(0);
    expect(memory.inscription.status).toBe("en_cours");
    expect(memory.calls).not.toContain("closeInscription");
  });

  it("annule les documents créés si le passage à Terminée échoue", async () => {
    const memory = createMemoryStore({ failAt: "closeInscription" });

    await expect(generateEndPack(memory.store, input())).rejects.toThrow(
      /étape « passage au statut Terminée »/
    );

    expect(memory.invoices).toHaveLength(0);
    expect(memory.certificates).toHaveLength(0);
    expect(memory.surveys).toHaveLength(0);
    expect(memory.inscription.status).toBe("en_cours");
    expect(memory.inscription.end_pack_sent_at).toBeNull();
  });

  it("ne touche pas à une facture déjà présente si une étape suivante échoue", async () => {
    const memory = createMemoryStore({
      failAt: "insertCertificate",
      seed: {
        invoices: [
          { id: "inv-existant", invoice_number: "26-27.14298", inscription_id: "ins-1" },
        ],
      },
    });

    await expect(generateEndPack(memory.store, input())).rejects.toThrow(
      /Rien n'avait encore été créé/
    );

    expect(memory.invoices).toEqual([
      { id: "inv-existant", invoice_number: "26-27.14298", inscription_id: "ins-1" },
    ]);
    expect(memory.calls).not.toContain("deleteInvoice");
    expect(memory.inscription.status).toBe("en_cours");
  });

  it("refuse un certificat sans formulaire de sortie, sans rien écrire", async () => {
    const memory = createMemoryStore();
    await expect(
      generateEndPack(
        memory.store,
        input({ niveauGeneralSortie: "", commentaireSortie: "" })
      )
    ).rejects.toThrow(/formulaire de sortie formateur incomplet/);
    expect(memory.calls).toEqual([]);
    expect(memory.inscription.status).toBe("en_cours");
  });

  it("déduit l'acompte même si deposit_amount est null (repli balance_after_deposit)", async () => {
    const memory = createMemoryStore();
    memory.inscription.price = 300;
    memory.inscription.deposit_amount = null;
    memory.inscription.balance_after_deposit = 150;

    let inserted: { amount_ht: number; payment_type: string } | null = null;
    const baseInsert = memory.store.insertInvoice.bind(memory.store);
    memory.store.insertInvoice = async (row) => {
      inserted = { amount_ht: row.amount_ht, payment_type: row.payment_type };
      return baseInsert(row);
    };

    await generateEndPack(
      memory.store,
      input({ generateCertificate: false, sendSurvey: false })
    );
    expect(inserted).toEqual({ amount_ht: 150, payment_type: "saldo" });
  });

  it("le hook délègue au module et n'écrit plus le statut en premier", () => {
    const hook = readFileSync(join(process.cwd(), "src/hooks/useEndPack.ts"), "utf8");
    expect(hook).toContain("generateEndPack(createSupabaseEndPackStore(), data)");
    expect(hook).not.toMatch(/status:\s*"terminee"[\s\S]*generateInvoice/);
  });
});

describe("resolveEndPackDeposit", () => {
  it("privilégie deposit_amount quand il est renseigné", () => {
    expect(
      resolveEndPackDeposit({
        price: 300,
        deposit_amount: 150,
        balance_after_deposit: 150,
      })
    ).toBe(150);
  });

  it("reconstitue l'acompte via price − balance_after_deposit", () => {
    expect(
      resolveEndPackDeposit({
        price: 300,
        deposit_amount: null,
        balance_after_deposit: 150,
      })
    ).toBe(150);
  });

  it("renvoie 0 sans acompte ni solde partiel", () => {
    expect(
      resolveEndPackDeposit({
        price: 300,
        deposit_amount: null,
        balance_after_deposit: null,
      })
    ).toBe(0);
  });
});
