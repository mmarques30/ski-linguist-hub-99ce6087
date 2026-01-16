import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle2, 
  XCircle, 
  Circle, 
  ChevronDown, 
  RotateCcw,
  Download,
  ClipboardList
} from "lucide-react";
import { toast } from "sonner";

interface TestItem {
  id: string;
  name: string;
  description: string;
  status: "pending" | "success" | "failure";
  notes?: string;
}

interface TestSection {
  id: string;
  title: string;
  icon: string;
  items: TestItem[];
}

const initialTestData: TestSection[] = [
  {
    id: "auth",
    title: "🔐 Autenticação",
    icon: "🔐",
    items: [
      { id: "auth-1", name: "Login com credenciais válidas", description: "Acessar /auth, inserir credenciais válidas e verificar redirecionamento para Dashboard", status: "pending" },
      { id: "auth-2", name: "Logout", description: "Clicar no botão de logout no Sidebar e verificar redirecionamento para /auth", status: "pending" },
      { id: "auth-3", name: "Rota protegida sem login", description: "Sem login, acessar /dashboard e verificar redirecionamento para /auth", status: "pending" },
    ]
  },
  {
    id: "students",
    title: "👥 Alunos",
    icon: "👥",
    items: [
      { id: "students-1", name: "Criar aluno", description: "Ir para /students, clicar em 'Novo Aluno', preencher dados e verificar se aparece na lista", status: "pending" },
      { id: "students-2", name: "Visualizar detalhes do aluno", description: "Clicar em um aluno e verificar se mostra inscrições e estatísticas", status: "pending" },
      { id: "students-3", name: "Editar aluno", description: "Editar dados de um aluno existente e verificar atualização", status: "pending" },
    ]
  },
  {
    id: "inscriptions",
    title: "📝 Inscrições",
    icon: "📝",
    items: [
      { id: "inscriptions-1", name: "Criar inscrição", description: "Ir para /inscriptions, clicar em 'Nova Inscrição', preencher os passos do formulário", status: "pending" },
      { id: "inscriptions-2", name: "Código automático gerado", description: "Verificar se a inscrição recebeu código no formato FLI-YYXXXX", status: "pending" },
      { id: "inscriptions-3", name: "Editar status da inscrição", description: "Clicar em uma inscrição e alterar o status", status: "pending" },
      { id: "inscriptions-4", name: "Filtrar inscrições", description: "Testar filtros por status, idioma, etc.", status: "pending" },
    ]
  },
  {
    id: "invoices",
    title: "💰 Faturas",
    icon: "💰",
    items: [
      { id: "invoices-1", name: "Criar fatura", description: "Ir para /invoices, clicar em 'Nova Fatura', selecionar inscrição, valor e tipo", status: "pending" },
      { id: "invoices-2", name: "Número automático gerado", description: "Verificar se a fatura recebeu número no formato YYYY.XXXXX", status: "pending" },
      { id: "invoices-3", name: "Filtrar por status", description: "Filtrar por Brouillon, Envoyée, Payée", status: "pending" },
      { id: "invoices-4", name: "Editar fatura", description: "Clicar em uma fatura e editar os dados", status: "pending" },
      { id: "invoices-5", name: "Visualizar PDF da fatura", description: "Gerar e visualizar o PDF da fatura", status: "pending" },
    ]
  },
  {
    id: "reminders",
    title: "📧 Relances Automáticas",
    icon: "📧",
    items: [
      { id: "reminders-1", name: "Dry-run de relances", description: "Executar curl com dry_run=true e verificar resposta JSON", status: "pending" },
      { id: "reminders-2", name: "Lógica de níveis", description: "Verificar se respeita 7, 15, 30 dias de atraso", status: "pending" },
      { id: "reminders-3", name: "Faturas ignoradas corretamente", description: "Verificar se faturas < 7 dias são ignoradas", status: "pending" },
    ]
  },
  {
    id: "placement",
    title: "📊 Testes de Posicionamento",
    icon: "📊",
    items: [
      { id: "placement-1", name: "Visualizar lista de testes", description: "Ir para /placement-tests e verificar lista com estatísticas", status: "pending" },
      { id: "placement-2", name: "Detalhes do teste", description: "Clicar em um teste e verificar informações", status: "pending" },
    ]
  },
  {
    id: "evaluations",
    title: "📝 Avaliações (Compte-Rendu)",
    icon: "📝",
    items: [
      { id: "evaluations-1", name: "Listar avaliações pendentes", description: "Ir para /formateur/evaluations e verificar lista", status: "pending" },
      { id: "evaluations-2", name: "Criar avaliação", description: "Selecionar teste, preencher scores e apreciações", status: "pending" },
      { id: "evaluations-3", name: "Visualizar PDF do CR", description: "Clicar em 'Voir CR' e verificar PDF gerado", status: "pending" },
      { id: "evaluations-4", name: "Sistema de frases", description: "Verificar se frases pré-definidas são carregadas por categoria", status: "pending" },
    ]
  },
  {
    id: "satisfaction",
    title: "😊 Satisfação",
    icon: "😊",
    items: [
      { id: "satisfaction-1", name: "Ver estatísticas", description: "Ir para /satisfaction-stats e verificar gráficos e médias", status: "pending" },
      { id: "satisfaction-2", name: "Gerar QR Code", description: "Clicar em 'Générer QR' e verificar QR Code para pesquisa", status: "pending" },
      { id: "satisfaction-3", name: "Responder pesquisa", description: "Acessar link da pesquisa e preencher formulário", status: "pending" },
    ]
  },
  {
    id: "finance",
    title: "💹 Finanças",
    icon: "💹",
    items: [
      { id: "finance-1", name: "Dashboard financeiro", description: "Ir para /finance/dashboard e verificar KPIs atualizados", status: "pending" },
      { id: "finance-2", name: "Charges fixes", description: "Ir para /finance/charges-fixes e verificar impayés e progressão", status: "pending" },
      { id: "finance-3", name: "Rentabilidade", description: "Ir para /finance/rentabilite e verificar análise por formação", status: "pending" },
      { id: "finance-4", name: "Tesouraria", description: "Ir para /finance/tresorerie e verificar projeção de fluxo", status: "pending" },
      { id: "finance-5", name: "Comparação N-1", description: "Verificar se comparação com ano anterior funciona", status: "pending" },
      { id: "finance-6", name: "Realtime updates", description: "Criar/editar fatura e verificar se dashboard atualiza automaticamente", status: "pending" },
    ]
  },
  {
    id: "endpack",
    title: "📦 Pack Fin de Formation",
    icon: "📦",
    items: [
      { id: "endpack-1", name: "Gerar pack completo", description: "Selecionar inscrição e gerar fatura + attestation + certificado", status: "pending" },
      { id: "endpack-2", name: "Status atualizado", description: "Verificar se status da inscrição foi atualizado para concluído", status: "pending" },
      { id: "endpack-3", name: "Link de satisfação gerado", description: "Verificar se link do questionário foi criado", status: "pending" },
    ]
  },
  {
    id: "improvement",
    title: "🔄 Amélioration Continue",
    icon: "🔄",
    items: [
      { id: "improvement-1", name: "Criar ação", description: "Ir para /continuous-improvement e criar nova ação", status: "pending" },
      { id: "improvement-2", name: "Filtrar por tipo", description: "Filtrar por correctiva, préventive, amélioration", status: "pending" },
      { id: "improvement-3", name: "Atualizar status", description: "Alterar status de uma ação existente", status: "pending" },
    ]
  },
];

const STORAGE_KEY = "fli-testing-checklist";

export default function TestingChecklist() {
  const [testData, setTestData] = useState<TestSection[]>(initialTestData);
  const [openSections, setOpenSections] = useState<string[]>(["auth"]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setTestData(JSON.parse(saved));
      } catch {
        console.error("Failed to load saved test data");
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(testData));
  }, [testData]);

  const updateItemStatus = (sectionId: string, itemId: string, status: TestItem["status"]) => {
    setTestData(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          )
        };
      }
      return section;
    }));
    
    const statusMessages = {
      success: "✅ Marcado como sucesso!",
      failure: "❌ Marcado como falha!",
      pending: "⏳ Resetado para pendente"
    };
    toast.success(statusMessages[status]);
  };

  const resetAll = () => {
    setTestData(initialTestData);
    toast.success("Checklist resetado!");
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Calculate stats
  const allItems = testData.flatMap(s => s.items);
  const total = allItems.length;
  const success = allItems.filter(i => i.status === "success").length;
  const failure = allItems.filter(i => i.status === "failure").length;
  const pending = allItems.filter(i => i.status === "pending").length;
  const progress = total > 0 ? ((success + failure) / total) * 100 : 0;

  const exportResults = () => {
    const results = {
      date: new Date().toISOString(),
      summary: { total, success, failure, pending, progress: progress.toFixed(1) + "%" },
      sections: testData.map(s => ({
        title: s.title,
        items: s.items.map(i => ({
          name: i.name,
          status: i.status
        }))
      }))
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fli-test-results-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Resultados exportados!");
  };

  const getStatusIcon = (status: TestItem["status"]) => {
    switch (status) {
      case "success": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failure": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSectionStats = (section: TestSection) => {
    const total = section.items.length;
    const done = section.items.filter(i => i.status !== "pending").length;
    const successCount = section.items.filter(i => i.status === "success").length;
    return { total, done, successCount };
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ClipboardList className="h-8 w-8" />
              Checklist de Testes
            </h1>
            <p className="text-muted-foreground mt-1">
              Validação completa das funcionalidades do sistema FLI
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportResults}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="destructive" onClick={resetAll}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{success}</div>
                  <div className="text-sm text-muted-foreground">Sucesso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{failure}</div>
                  <div className="text-sm text-muted-foreground">Falha</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{pending}</div>
                  <div className="text-sm text-muted-foreground">Pendente</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Concluído</div>
              </div>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Test Sections */}
        <div className="space-y-4">
          {testData.map(section => {
            const stats = getSectionStats(section);
            const isOpen = openSections.includes(section.id);
            
            return (
              <Collapsible key={section.id} open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {section.title}
                          <Badge variant="outline" className="ml-2">
                            {stats.done}/{stats.total}
                          </Badge>
                          {stats.done === stats.total && stats.successCount === stats.total && (
                            <Badge className="bg-green-500">✓ Completo</Badge>
                          )}
                        </CardTitle>
                        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {section.items.map(item => (
                          <div 
                            key={item.id}
                            className="flex items-start justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {getStatusIcon(item.status)}
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">{item.description}</div>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                size="sm"
                                variant={item.status === "success" ? "default" : "outline"}
                                className={item.status === "success" ? "bg-green-500 hover:bg-green-600" : ""}
                                onClick={() => updateItemStatus(section.id, item.id, "success")}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={item.status === "failure" ? "default" : "outline"}
                                className={item.status === "failure" ? "bg-red-500 hover:bg-red-600" : ""}
                                onClick={() => updateItemStatus(section.id, item.id, "failure")}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateItemStatus(section.id, item.id, "pending")}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
