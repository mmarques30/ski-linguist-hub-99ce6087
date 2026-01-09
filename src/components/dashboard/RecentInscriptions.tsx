import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Inscription {
  id: string;
  name: string;
  email: string;
  language: string;
  level: string;
  status: "pending" | "confirmed" | "active" | "completed";
  date: string;
}

const statusStyles = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  confirmed: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  active: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  completed: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

const statusLabels = {
  pending: "Pendente",
  confirmed: "Confirmado",
  active: "Ativo",
  completed: "Concluído",
};

// Mock data - will be replaced with real data from Supabase
const mockInscriptions: Inscription[] = [
  {
    id: "1",
    name: "Jean-Pierre Dubois",
    email: "jp.dubois@esf.fr",
    language: "Inglês",
    level: "A2",
    status: "pending",
    date: "2026-01-08",
  },
  {
    id: "2",
    name: "Marie Laurent",
    email: "m.laurent@esf.fr",
    language: "Português",
    level: "B1",
    status: "confirmed",
    date: "2026-01-07",
  },
  {
    id: "3",
    name: "Pierre Martin",
    email: "p.martin@esf.fr",
    language: "Russo",
    level: "A1",
    status: "active",
    date: "2026-01-06",
  },
  {
    id: "4",
    name: "Sophie Bernard",
    email: "s.bernard@esf.fr",
    language: "Holandês",
    level: "B2",
    status: "completed",
    date: "2026-01-05",
  },
];

export function RecentInscriptions() {
  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b p-4">
        <h3 className="font-semibold">Inscrições Recentes</h3>
        <p className="text-sm text-muted-foreground">Últimas inscrições de alunos</p>
      </div>
      <div className="divide-y">
        {mockInscriptions.map((inscription) => (
          <div
            key={inscription.id}
            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {inscription.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium">{inscription.name}</p>
                <p className="text-sm text-muted-foreground">{inscription.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{inscription.language}</p>
                <p className="text-sm text-muted-foreground">Nível {inscription.level}</p>
              </div>
              <Badge className={cn(statusStyles[inscription.status])}>
                {statusLabels[inscription.status]}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <button className="text-sm font-medium text-primary hover:underline">
          Ver todas as inscrições
        </button>
      </div>
    </div>
  );
}
