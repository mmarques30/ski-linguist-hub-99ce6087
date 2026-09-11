import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle2, 
  XCircle, 
  Circle, 
  ChevronDown, 
  RotateCcw,
  Download,
  ClipboardList,
  MessageSquare,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { Emails8MinimalCard } from "@/components/admin/Emails8MinimalCard";
import { CleanupZztestCard } from "@/components/admin/CleanupZztestCard";

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
    title: "Authentification",
    icon: "🔐",
    items: [
      { id: "auth-1", name: "Connexion avec identifiants valides", description: "Ouvrir /auth, saisir des identifiants valides et vérifier la redirection vers le tableau de bord", status: "pending" },
      { id: "auth-2", name: "Déconnexion", description: "Cliquer sur Déconnexion dans la barre latérale et vérifier le retour vers /auth", status: "pending" },
      { id: "auth-3", name: "Route protégée sans session", description: "Sans connexion, ouvrir une page interne et vérifier la redirection vers /auth", status: "pending" },
    ]
  },
  {
    id: "students",
    title: "Stagiaires",
    icon: "👥",
    items: [
      { id: "students-1", name: "Créer un stagiaire", description: "Aller sur /students, cliquer sur Nouveau stagiaire, remplir le formulaire et vérifier l'apparition dans la liste", status: "pending" },
      { id: "students-2", name: "Voir la fiche stagiaire", description: "Ouvrir un stagiaire et vérifier inscriptions et statistiques", status: "pending" },
      { id: "students-3", name: "Modifier un stagiaire", description: "Modifier une fiche existante et vérifier la mise à jour", status: "pending" },
    ]
  },
  {
    id: "inscriptions",
    title: "Inscriptions",
    icon: "📝",
    items: [
      { id: "inscriptions-1", name: "Créer une inscription", description: "Aller sur /inscriptions, cliquer sur Nouvelle inscription, parcourir les étapes", status: "pending" },
      { id: "inscriptions-2", name: "Code automatique", description: "Vérifier qu'un code au format FLI-YYXXXX est attribué", status: "pending" },
      { id: "inscriptions-3", name: "Modifier le statut", description: "Ouvrir une inscription et changer le statut", status: "pending" },
      { id: "inscriptions-4", name: "Filtrer les inscriptions", description: "Tester les filtres par statut, langue, etc.", status: "pending" },
    ]
  },
  {
    id: "invoices",
    title: "Factures",
    icon: "💰",
    items: [
      { id: "invoices-1", name: "Créer une facture", description: "Aller sur /invoices, cliquer sur Nouvelle facture, choisir inscription, montant et type", status: "pending" },
      { id: "invoices-2", name: "Numéro automatique", description: "Vérifier un numéro au format YYYY.XXXXX", status: "pending" },
      { id: "invoices-3", name: "Filtrer par statut", description: "Filtrer par Brouillon, Envoyée, Payée", status: "pending" },
      { id: "invoices-4", name: "Modifier une facture", description: "Ouvrir une facture et modifier les données", status: "pending" },
      { id: "invoices-5", name: "Aperçu PDF", description: "Générer et afficher le PDF de la facture", status: "pending" },
    ]
  },
  {
    id: "reminders",
    title: "Relances automatiques",
    icon: "📧",
    items: [
      { id: "reminders-1", name: "Simulation de relances", description: "Exécuter un appel en dry_run=true et vérifier la réponse JSON", status: "pending" },
      { id: "reminders-2", name: "Niveaux de relance", description: "Vérifier le respect des délais 7, 15 et 30 jours", status: "pending" },
      { id: "reminders-3", name: "Factures ignorées", description: "Vérifier que les factures de moins de 7 jours sont ignorées", status: "pending" },
    ]
  },
  {
    id: "placement",
    title: "Tests de positionnement",
    icon: "📊",
    items: [
      { id: "placement-1", name: "Liste des tests", description: "Aller sur /tests et vérifier la liste avec statistiques", status: "pending" },
      { id: "placement-2", name: "Détail d'un test", description: "Ouvrir un test et vérifier les informations", status: "pending" },
    ]
  },
  {
    id: "evaluations",
    title: "Évaluations (compte-rendu)",
    icon: "📝",
    items: [
      { id: "evaluations-1", name: "Liste des évaluations", description: "Aller sur /formateur/evaluations et vérifier la liste", status: "pending" },
      { id: "evaluations-2", name: "Saisir une évaluation", description: "Choisir un test, remplir les notes et les blocs", status: "pending" },
      { id: "evaluations-3", name: "Aperçu du compte-rendu", description: "Ouvrir l'aperçu et vérifier le contenu généré", status: "pending" },
      { id: "evaluations-4", name: "Banque de phrases", description: "Vérifier le chargement des phrases par catégorie", status: "pending" },
    ]
  },
  {
    id: "satisfaction",
    title: "Satisfaction",
    icon: "😊",
    items: [
      { id: "satisfaction-1", name: "Statistiques", description: "Aller sur /satisfaction-stats et vérifier graphiques et moyennes", status: "pending" },
      { id: "satisfaction-2", name: "QR Code", description: "Générer un QR et vérifier le lien vers le questionnaire", status: "pending" },
      { id: "satisfaction-3", name: "Répondre au questionnaire", description: "Ouvrir le lien du questionnaire et le remplir", status: "pending" },
    ]
  },
  {
    id: "finance",
    title: "Finance",
    icon: "💹",
    items: [
      { id: "finance-1", name: "Tableau de bord financier", description: "Aller sur /finance et vérifier les indicateurs", status: "pending" },
      { id: "finance-2", name: "Charges fixes", description: "Aller sur /finance/charges-fixes et vérifier impayés et progression", status: "pending" },
      { id: "finance-3", name: "Rentabilité", description: "Aller sur /finance/rentabilite et vérifier l'analyse par formation", status: "pending" },
      { id: "finance-4", name: "Trésorerie", description: "Aller sur /finance/tresorerie et vérifier la projection", status: "pending" },
      { id: "finance-5", name: "Comparaison N-1", description: "Vérifier la comparaison avec l'année précédente", status: "pending" },
      { id: "finance-6", name: "Mises à jour temps réel", description: "Créer ou modifier une facture et vérifier le rafraîchissement", status: "pending" },
    ]
  },
  {
    id: "endpack",
    title: "Pack fin de formation",
    icon: "📦",
    items: [
      { id: "endpack-1", name: "Générer le pack", description: "Sélectionner une inscription et générer facture + attestation + certificat", status: "pending" },
      { id: "endpack-2", name: "Statut mis à jour", description: "Vérifier que le statut de l'inscription passe à terminé", status: "pending" },
      { id: "endpack-3", name: "Lien de satisfaction", description: "Vérifier la création du lien de questionnaire", status: "pending" },
    ]
  },
  {
    id: "improvement",
    title: "Amélioration continue",
    icon: "🔄",
    items: [
      { id: "improvement-1", name: "Créer une action", description: "Aller sur /amelioration et créer une action", status: "pending" },
      { id: "improvement-2", name: "Filtrer par type", description: "Filtrer par corrective, préventive, amélioration", status: "pending" },
      { id: "improvement-3", name: "Mettre à jour le statut", description: "Changer le statut d'une action existante", status: "pending" },
    ]
  },
];

const STORAGE_KEY = "fli-testing-checklist-fr";

export default function TestingChecklist() {
  const [testData, setTestData] = useState<TestSection[]>(initialTestData);
  const [openSections, setOpenSections] = useState<string[]>(["auth"]);
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);

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
      success: "Marqué comme réussi",
      failure: "Marqué comme échec",
      pending: "Remis en attente"
    };
    toast.success(statusMessages[status]);
  };

  const updateItemNotes = (sectionId: string, itemId: string, notes: string) => {
    setTestData(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => 
            item.id === itemId ? { ...item, notes } : item
          )
        };
      }
      return section;
    }));
  };

  const toggleNotes = (itemId: string) => {
    setExpandedNotes(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const resetAll = () => {
    setTestData(initialTestData);
    toast.success("Checklist réinitialisée");
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
          status: i.status,
          notes: i.notes || null
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
    toast.success("Résultats exportés");
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
              Tests QA
            </h1>
            <p className="text-muted-foreground mt-1">
              Scénario du lundi 14/09 : voir docs/TESTING_GUIDE.md. Convention : nom ZZTEST
              et email @example.invalid.
            </p>
          </div>
        </div>

        <Emails8MinimalCard />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Checklist de recette</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportResults}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" onClick={resetAll}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser la checklist
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{success}</div>
                  <div className="text-sm text-muted-foreground">Réussi</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{failure}</div>
                  <div className="text-sm text-muted-foreground">Échec</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{pending}</div>
                  <div className="text-sm text-muted-foreground">En attente</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Avancement</div>
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
                            <Badge className="bg-green-500">Terminé</Badge>
                          )}
                        </CardTitle>
                        <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {section.items.map(item => {
                          const isNotesExpanded = expandedNotes.includes(item.id);
                          const hasNotes = item.notes && item.notes.trim().length > 0;
                          
                          return (
                            <div 
                              key={item.id}
                              className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  {getStatusIcon(item.status)}
                                  <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-sm text-muted-foreground">{item.description}</div>
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button
                                    size="sm"
                                    variant={hasNotes ? "secondary" : "ghost"}
                                    className={hasNotes ? "text-blue-600" : ""}
                                    onClick={() => toggleNotes(item.id)}
                                    title="Ajouter une note"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    {isNotesExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                                  </Button>
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
                              
                              {/* Notes Section */}
                              {isNotesExpanded && (
                                <div className="mt-3 pt-3 border-t">
                                  <Textarea
                                    placeholder="Notes, anomalies, captures à joindre…"
                                    value={item.notes || ""}
                                    onChange={(e) => updateItemNotes(section.id, item.id, e.target.value)}
                                    className="min-h-[80px] text-sm"
                                  />
                                </div>
                              )}
                              
                              {/* Show notes preview when collapsed */}
                              {!isNotesExpanded && hasNotes && (
                                <div 
                                  className="mt-2 pt-2 border-t text-sm text-blue-600 cursor-pointer hover:underline"
                                  onClick={() => toggleNotes(item.id)}
                                >
                                  📝 {item.notes!.substring(0, 100)}{item.notes!.length > 100 ? "..." : ""}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>

        <div className="border-t pt-8">
          <CleanupZztestCard />
        </div>
      </div>
    </MainLayout>
  );
}
