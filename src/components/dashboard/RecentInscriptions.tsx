import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ClipboardList, Loader2 } from "lucide-react";
import { useInscriptions } from "@/hooks/useInscriptions";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusStyles: Record<string, string> = {
  "En cours": "bg-blue-100 text-blue-800 hover:bg-blue-100",
  "Facturé": "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  "Terminé": "bg-gray-100 text-gray-800 hover:bg-gray-100",
  "Annulé": "bg-red-100 text-red-800 hover:bg-red-100",
};

const statusLabels: Record<string, string> = {
  "En cours": "En cours",
  "Facturé": "Facturée",
  "Terminé": "Terminée",
  "Annulé": "Annulée",
};

export function RecentInscriptions() {
  const { data: inscriptions, isLoading } = useInscriptions();
  
  const recentInscriptions = inscriptions?.slice(0, 5) || [];

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h3 className="font-semibold">Inscriptions récentes</h3>
        <p className="text-sm text-muted-foreground">Dernières inscriptions de stagiaires</p>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : recentInscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium">Aucune inscription récente</p>
          <p className="text-sm text-muted-foreground">
            Les inscriptions apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {recentInscriptions.map((inscription) => (
            <div
              key={inscription.id}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {getInitials(inscription.student_name)}
                </div>
                <div>
                  <p className="font-medium">{inscription.student_name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{inscription.student_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{inscription.language}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(inscription.start_date)}</p>
                </div>
                <Badge className={cn(statusStyles[inscription.status] || "bg-gray-100 text-gray-800")}>
                  {statusLabels[inscription.status] || inscription.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t p-4">
        <Link to="/inscriptions" className="text-sm font-medium text-primary hover:underline">
          Voir toutes les inscriptions
        </Link>
      </div>
    </div>
  );
}
