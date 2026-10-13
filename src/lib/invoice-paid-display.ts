/**
 * Libellés solde / acompte sur la facture — une facture « paid » ne doit
 * jamais laisser croire qu'il reste un solde à régler.
 */

export type InvoicePaidDisplay = {
  showAcompteBlock: boolean;
  acompteLabel: string;
  soldeLabel: string;
  soldeIsOutstanding: boolean;
  netLabel: string | null;
  netAmount: number;
};

export function invoicePaidDisplay(input: {
  status: string | null | undefined;
  acompteAmount?: number | null;
  totalTtc: number;
}): InvoicePaidDisplay {
  const paid = (input.status || "").toLowerCase() === "paid";
  const acompte = Number(input.acompteAmount || 0);
  const total = Number(input.totalTtc || 0);
  const showAcompteBlock = acompte > 0;
  const solde = Math.max(0, Math.round((total - acompte) * 100) / 100);

  if (!showAcompteBlock) {
    return {
      showAcompteBlock: false,
      acompteLabel: "",
      soldeLabel: "",
      soldeIsOutstanding: false,
      netLabel: paid ? "Payée intégralement" : null,
      netAmount: paid ? 0 : total,
    };
  }

  return {
    showAcompteBlock: true,
    acompteLabel: "Acompte reçu",
    soldeLabel: paid ? "Solde réglé" : "Solde à payer",
    soldeIsOutstanding: !paid,
    netLabel: paid ? "Net à payer" : null,
    netAmount: paid ? 0 : solde,
  };
}
