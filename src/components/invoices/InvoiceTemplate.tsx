import { format } from "date-fns";
import { fr } from "date-fns/locale";
import fliLogo from "@/assets/fli-invoice-logo.png";
import factureAcquitteeStamp from "@/assets/facture-acquittee-stamp.png";

export type InvoiceType = "formation" | "test" | "soustraitance";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  invoiceType: InvoiceType;
  status: "draft" | "sent" | "paid" | "cancelled";
  // Client info
  clientName: string;
  clientAddress: string;
  clientCity: string;
  clientPostalCode: string;
  clientCompany?: string;
  // Course details (for formation)
  courseDescription?: string;
  courseDateStart?: Date;
  courseDateEnd?: Date;
  courseDuration?: number;
  courseLocation?: string;
  // Amounts
  amountHT: number;
  tvaRate: number;
  amountTTC: number;
  // Acompte (deposit)
  acompteAmount?: number;
  acompteDate?: Date;
  // Items (for test/soustraitance)
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  // Payment info
  paymentDate?: Date;
  paymentMethod?: string;
}

const templateConfig = {
  formation: {
    showTVA: false,
    showQuantityColumns: false,
    showDateRange: true,
    showAcompte: true,
    showStampWhenPaid: true,
    showTVANumber: false,
  },
  test: {
    showTVA: true,
    showQuantityColumns: true,
    showDateRange: false,
    showAcompte: false,
    showStampWhenPaid: true,
    showTVANumber: true,
  },
  soustraitance: {
    showTVA: true,
    showQuantityColumns: true,
    showDateRange: true,
    showAcompte: false,
    showStampWhenPaid: false,
    showTVANumber: true,
  },
};

const FLI_INFO = {
  name: "France Langues International",
  address: "25 avenue de la gare",
  city: "73800 Montmélian",
  phone: "+33 (0)6 27 13 45 16",
  email: "contact@france-langues-international.com",
  siret: "484 772 041 00048",
  tvaNumber: "FR 44 484772041",
  iban: "FR76 1820 6004 4339 5412 7300 144",
  bic: "AGRIFRPP882",
};

interface InvoiceTemplateProps {
  data: InvoiceData;
  className?: string;
}

export function InvoiceTemplate({ data, className = "" }: InvoiceTemplateProps) {
  const config = templateConfig[data.invoiceType];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: fr });
  };

  const getTitle = () => {
    switch (data.invoiceType) {
      case "formation":
        return "FACTURE";
      case "test":
        return "FACTURE - Test de niveau";
      case "soustraitance":
        return "FACTURE - Sous-traitance";
      default:
        return "FACTURE";
    }
  };

  const showStamp = config.showStampWhenPaid && data.status === "paid";
  const balanceAfterAcompte = data.acompteAmount 
    ? data.amountTTC - data.acompteAmount 
    : data.amountTTC;

  return (
    <div className={`bg-white text-gray-900 p-8 max-w-[210mm] mx-auto shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <img src={fliLogo} alt="FLI Logo" className="h-16 mb-4" />
          <div className="text-sm text-gray-600 space-y-0.5">
            <p className="font-semibold text-gray-900">{FLI_INFO.name}</p>
            <p>{FLI_INFO.address}</p>
            <p>{FLI_INFO.city}</p>
            <p>Tél: {FLI_INFO.phone}</p>
            <p>{FLI_INFO.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold text-[#FCAF17] mb-4">{getTitle()}</h1>
          <div className="text-sm space-y-1">
            <p><span className="text-gray-500">N°:</span> <span className="font-mono font-semibold">{data.invoiceNumber}</span></p>
            <p><span className="text-gray-500">Date:</span> {formatDate(data.invoiceDate)}</p>
            <p><span className="text-gray-500">Échéance:</span> {formatDate(data.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Client info */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Client</p>
        <p className="font-semibold">{data.clientName}</p>
        {data.clientCompany && <p className="text-gray-700">{data.clientCompany}</p>}
        {data.clientAddress && <p className="text-gray-700">{data.clientAddress}</p>}
        <p className="text-gray-700">{data.clientPostalCode} {data.clientCity}</p>
      </div>

      {/* Course period (for formation) */}
      {config.showDateRange && data.courseDateStart && data.courseDateEnd && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Période de formation</p>
              <p className="font-medium">
                Du {formatDate(data.courseDateStart)} au {formatDate(data.courseDateEnd)}
              </p>
            </div>
            {data.courseDuration && (
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Durée</p>
                <p className="font-medium">{data.courseDuration} heures</p>
              </div>
            )}
            {data.courseLocation && (
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Lieu</p>
                <p className="font-medium">{data.courseLocation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#FCAF17]">
              <th className="text-left py-2 text-sm font-semibold text-gray-700">Description</th>
              {config.showQuantityColumns && (
                <>
                  <th className="text-center py-2 text-sm font-semibold text-gray-700 w-20">Qté</th>
                  <th className="text-right py-2 text-sm font-semibold text-gray-700 w-28">Prix unit.</th>
                </>
              )}
              <th className="text-right py-2 text-sm font-semibold text-gray-700 w-28">Montant</th>
            </tr>
          </thead>
          <tbody>
            {data.invoiceType === "formation" ? (
              <tr className="border-b border-gray-100">
                <td className="py-3">
                  <p className="font-medium">{data.courseDescription || "Formation linguistique"}</p>
                  {data.courseLocation && (
                    <p className="text-sm text-gray-500">Lieu: {data.courseLocation}</p>
                  )}
                </td>
                <td className="py-3 text-right font-medium">{formatPrice(data.amountHT)}</td>
              </tr>
            ) : (
              data.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3">{item.description}</td>
                  <td className="py-3 text-center">{item.quantity}</td>
                  <td className="py-3 text-right">{formatPrice(item.unitPrice)}</td>
                  <td className="py-3 text-right font-medium">{formatPrice(item.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Total HT</span>
            <span className="font-medium">{formatPrice(data.amountHT)}</span>
          </div>
          {config.showTVA ? (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">TVA ({data.tvaRate}%)</span>
              <span className="font-medium">{formatPrice(data.amountHT * data.tvaRate / 100)}</span>
            </div>
          ) : (
            <div className="flex justify-between py-2 border-b border-gray-100 text-gray-500 italic">
              <span>TVA non applicable</span>
              <span>art. 261.4.4°a CGI</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b-2 border-[#FCAF17] text-lg">
            <span className="font-semibold">Total TTC</span>
            <span className="font-bold text-[#FCAF17]">{formatPrice(data.amountTTC)}</span>
          </div>

          {/* Acompte */}
          {config.showAcompte && data.acompteAmount && data.acompteAmount > 0 && (
            <>
              <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-600">
                  Acompte reçu{data.acompteDate && ` le ${formatDate(data.acompteDate)}`}
                </span>
                <span className="text-green-600">- {formatPrice(data.acompteAmount)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg">
                <span className="font-semibold">Solde à payer</span>
                <span className="font-bold">{formatPrice(balanceAfterAcompte)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stamp for paid invoices */}
      {showStamp && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none rotate-[-15deg]">
          <img src={factureAcquitteeStamp} alt="Facture Acquittée" className="w-48" />
        </div>
      )}

      {/* Payment info */}
      <div className="border-t border-gray-200 pt-6 text-sm">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Coordonnées bancaires</p>
            <p><span className="text-gray-500">IBAN:</span> {FLI_INFO.iban}</p>
            <p><span className="text-gray-500">BIC:</span> {FLI_INFO.bic}</p>
          </div>
          <div className="text-right">
            <p><span className="text-gray-500">SIRET:</span> {FLI_INFO.siret}</p>
            {config.showTVANumber && (
              <p><span className="text-gray-500">N° TVA:</span> {FLI_INFO.tvaNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-500 space-y-0.5">
        <p className="font-medium">France Langues International - organisme de formation</p>
        <p>SARL au capital de 5000 euros</p>
        <p>25 avenue de la gare, 73800 Montmélian</p>
        <p>Siret : 484 772 041 00048 - RCS Chambéry - NAF : 8559A</p>
        <p>Organisme de formation n° 82 73 01 366 73</p>
        <p className="italic">Version 5 du 10 janvier 2026</p>
      </div>
    </div>
  );
}
