import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StudentProtectedRoute } from "@/components/auth/StudentProtectedRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Dashboard from "./pages/Dashboard";
import Inscriptions from "./pages/Inscriptions";
import InscriptionDetails from "./pages/inscriptions/InscriptionDetails";
import Invoices from "./pages/Invoices";
import Students from "./pages/Students";
import StudentDetails from "./pages/students/StudentDetails";
import PlacementTests from "./pages/PlacementTests";
import Classes from "./pages/Classes";
import Sessions from "./pages/Sessions";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Import from "./pages/admin/Import";
import ImportPhrases from "./pages/admin/ImportPhrases";
import AdminPhrases from "./pages/admin/Phrases";
import TestingChecklist from "./pages/admin/TestingChecklist";
import Seasons from "./pages/admin/Seasons";
import UserManagement from "./pages/admin/UserManagement";
import EvaluationsList from "./pages/formateur/EvaluationsList";
import EvaluationForm from "./pages/formateur/EvaluationForm";
import EvaluationView from "./pages/formateur/EvaluationView";
import Register from "./pages/register/Index";
import SatisfactionSurvey from "./pages/survey/SatisfactionSurvey";
import ContinuousImprovement from "./pages/ContinuousImprovement";
import SatisfactionStats from "./pages/SatisfactionStats";
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import FinanceAnalyses from "./pages/finance/FinanceAnalyses";
import FinanceRentabilite from "./pages/finance/FinanceRentabilite";
import FinanceTresorerie from "./pages/finance/FinanceTresorerie";
import FinancePayments from "./pages/finance/FinancePayments";
import FinanceChargesFixes from "./pages/finance/FinanceChargesFixes";
import PartnersList from "./pages/partners/PartnersList";
import PartnerDetails from "./pages/partners/PartnerDetails";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import InstructorsList from "./pages/formateurs/InstructorsList";
import InstructorDetails from "./pages/formateurs/InstructorDetails";
import QualiopiAudit from "./pages/qualite/QualiopiAudit";
import AuditHistory from "./pages/qualite/AuditHistory";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentTest from "./pages/student/StudentTest";
import StudentDocuments from "./pages/student/StudentDocuments";
import StudentEvaluation from "./pages/student/StudentEvaluation";
import StudentPlanning from "./pages/student/StudentPlanning";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/survey/:token" element={<SatisfactionSurvey />} />
            
            {/* Protected admin routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
            <Route path="/finance/analyses" element={<ProtectedRoute><FinanceAnalyses /></ProtectedRoute>} />
            <Route path="/finance/rentabilite" element={<ProtectedRoute><FinanceRentabilite /></ProtectedRoute>} />
            <Route path="/finance/tresorerie" element={<ProtectedRoute><FinanceTresorerie /></ProtectedRoute>} />
            <Route path="/finance/payments" element={<ProtectedRoute><FinancePayments /></ProtectedRoute>} />
            <Route path="/finance/charges-fixes" element={<ProtectedRoute><FinanceChargesFixes /></ProtectedRoute>} />
            <Route path="/gestion/commercial" element={<ProtectedRoute><CommercialDashboard /></ProtectedRoute>} />
            <Route path="/gestion/partenaires" element={<ProtectedRoute><PartnersList /></ProtectedRoute>} />
            <Route path="/gestion/partenaires/:id" element={<ProtectedRoute><PartnerDetails /></ProtectedRoute>} />
            <Route path="/inscriptions" element={<ProtectedRoute><Inscriptions /></ProtectedRoute>} />
            <Route path="/inscriptions/:id" element={<ProtectedRoute><InscriptionDetails /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute><StudentDetails /></ProtectedRoute>} />
            <Route path="/tests" element={<ProtectedRoute><PlacementTests /></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
            <Route path="/formation/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
            <Route path="/admin/import-phrases" element={<ProtectedRoute><ImportPhrases /></ProtectedRoute>} />
            <Route path="/admin/phrases" element={<ProtectedRoute><AdminPhrases /></ProtectedRoute>} />
            <Route path="/admin/testing" element={<ProtectedRoute><TestingChecklist /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/seasons" element={<ProtectedRoute><Seasons /></ProtectedRoute>} />
            <Route path="/formateur/evaluations" element={<ProtectedRoute><EvaluationsList /></ProtectedRoute>} />
            <Route path="/formateur/evaluation/:bookingId" element={<ProtectedRoute><EvaluationForm /></ProtectedRoute>} />
            <Route path="/formateur/evaluation/:bookingId/edit" element={<ProtectedRoute><EvaluationForm /></ProtectedRoute>} />
            <Route path="/formateur/evaluation-view/:evaluationId" element={<ProtectedRoute><EvaluationView /></ProtectedRoute>} />
            <Route path="/amelioration" element={<ProtectedRoute><ContinuousImprovement /></ProtectedRoute>} />
            <Route path="/satisfaction-stats" element={<ProtectedRoute><SatisfactionStats /></ProtectedRoute>} />
            <Route path="/formateurs" element={<ProtectedRoute><InstructorsList /></ProtectedRoute>} />
            <Route path="/formateurs/:id" element={<ProtectedRoute><InstructorDetails /></ProtectedRoute>} />
            <Route path="/qualite/audit" element={<ProtectedRoute><QualiopiAudit /></ProtectedRoute>} />
            <Route path="/qualite/historique" element={<ProtectedRoute><AuditHistory /></ProtectedRoute>} />

            {/* Student portal routes */}
            <Route path="/student/dashboard" element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>} />
            <Route path="/student/test" element={<StudentProtectedRoute><StudentTest /></StudentProtectedRoute>} />
            <Route path="/student/planning" element={<StudentProtectedRoute><StudentPlanning /></StudentProtectedRoute>} />
            <Route path="/student/documents" element={<StudentProtectedRoute><StudentDocuments /></StudentProtectedRoute>} />
            <Route path="/student/evaluation" element={<StudentProtectedRoute><StudentEvaluation /></StudentProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
