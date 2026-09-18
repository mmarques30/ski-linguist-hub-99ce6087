import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { StudentProtectedRoute } from "@/components/auth/StudentProtectedRoute";
import { AssistStudentRoute } from "@/components/auth/AssistStudentRoute";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SeasonProvider } from "@/contexts/SeasonContext";
import {
  StudentAssistViewProvider,
  StudentOwnViewProvider,
} from "@/contexts/StudentViewContext";
import {
  FormateurAssistViewProvider,
  FormateurOwnViewProvider,
} from "@/contexts/FormateurViewContext";
import { AssistFormateurRoute } from "@/components/auth/AssistFormateurRoute";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import InscriptionSuiviPage from "./pages/suivi/InscriptionSuiviPage";
import { studentAssistPath } from "@/lib/client-links";
import Dashboard from "./pages/Dashboard";
import Inscriptions from "./pages/Inscriptions";
import InscriptionDetails from "./pages/inscriptions/InscriptionDetails";
import ScheduleValidation from "./pages/inscriptions/ScheduleValidation";
import Invoices from "./pages/Invoices";
import Students from "./pages/Students";
import StudentDetails from "./pages/students/StudentDetails";
import PlacementTests from "./pages/PlacementTests";
import Sessions from "./pages/Sessions";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Import from "./pages/admin/Import";
import ImportPhrases from "./pages/admin/ImportPhrases";
import AdminEmails from "./pages/admin/Emails";
import AdminRegistrationDocuments from "./pages/admin/RegistrationDocuments";
import AdminPhrases from "./pages/admin/Phrases";
import TestingChecklist from "./pages/admin/TestingChecklist";
import Seasons from "./pages/admin/Seasons";
import UserManagement from "./pages/admin/UserManagement";
import EvaluationsList from "./pages/formateur/EvaluationsList";
import EvaluationForm from "./pages/formateur/EvaluationForm";
import EvaluationView from "./pages/formateur/EvaluationView";
import EvaluationVerify from "./pages/formateur/EvaluationVerify";
import Register from "./pages/register/Index";
import BookTest from "./pages/test/BookTest";
import { PaymentSuccessPage, PaymentCancelPage } from "./pages/register/PaymentReturn";
import SatisfactionSurvey from "./pages/survey/SatisfactionSurvey";
import ContinuousImprovement from "./pages/ContinuousImprovement";
import SatisfactionStats from "./pages/SatisfactionStats";
import PortalStudentPicker from "./pages/portails/PortalStudentPicker";
import PortalFormateurPicker from "./pages/portails/PortalFormateurPicker";
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
import CommercialDashboard from "./pages/commercial/CommercialDashboard";
import MoniteursSki from "./pages/moniteurs/MoniteursSki";
import DashboardGestaoMockupPage from "./pages/mockup/DashboardGestaoMockup";
import ConditionsGenerales from "./pages/legal/ConditionsGenerales";

function StudentPortalPreviewRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/students" replace />;
  return <Navigate to={studentAssistPath(id, "dashboard")} replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <SeasonProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reserver-test" element={<BookTest />} />
            <Route path="/register/payment-success" element={<PaymentSuccessPage />} />
            <Route path="/register/payment-cancel" element={<PaymentCancelPage />} />
            <Route path="/survey/:token" element={<SatisfactionSurvey />} />
            <Route path="/suivi/:token" element={<InscriptionSuiviPage />} />
            <Route path="/conditions-generales" element={<ConditionsGenerales />} />

            {/* Design-validation mockup — staff only */}
            <Route
              path="/mockup/dashboard-gestao"
              element={
                <ProtectedRoute>
                  <DashboardGestaoMockupPage />
                </ProtectedRoute>
              }
            />
            {/* Protected admin routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
            <Route path="/finance/analyses" element={<ProtectedRoute><FinanceAnalyses /></ProtectedRoute>} />
            <Route path="/finance/rentabilite" element={<ProtectedRoute><FinanceRentabilite /></ProtectedRoute>} />
            <Route path="/finance/tresorerie" element={<ProtectedRoute><FinanceTresorerie /></ProtectedRoute>} />
            <Route path="/finance/payments" element={<ProtectedRoute><FinancePayments /></ProtectedRoute>} />
            <Route path="/finance/charges-fixes" element={<ProtectedRoute><FinanceChargesFixes /></ProtectedRoute>} />
            <Route path="/gestion/commercial" element={<ProtectedRoute><CommercialDashboard /></ProtectedRoute>} />
            <Route path="/gestion/moniteurs" element={<ProtectedRoute><MoniteursSki /></ProtectedRoute>} />
            <Route path="/gestion/partenaires" element={<ProtectedRoute><PartnersList /></ProtectedRoute>} />
            <Route path="/gestion/partenaires/:id" element={<ProtectedRoute><PartnerDetails /></ProtectedRoute>} />
            <Route path="/inscriptions" element={<ProtectedRoute><Inscriptions /></ProtectedRoute>} />
            <Route path="/inscriptions/schedule-validation" element={<ProtectedRoute><ScheduleValidation /></ProtectedRoute>} />
            <Route path="/inscriptions/:id" element={<ProtectedRoute><InscriptionDetails /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute><StudentDetails /></ProtectedRoute>} />
            <Route
              path="/students/:id/portal-preview"
              element={
                <ProtectedRoute>
                  <StudentPortalPreviewRedirect />
                </ProtectedRoute>
              }
            />
            <Route path="/tests" element={<ProtectedRoute><PlacementTests /></ProtectedRoute>} />
            <Route path="/classes" element={<Navigate to="/formation/sessions" replace />} />
            <Route path="/formation/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute routeKey="dashboard"><Notifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
            <Route path="/admin/import-phrases" element={<ProtectedRoute><ImportPhrases /></ProtectedRoute>} />
            <Route path="/admin/phrases" element={<ProtectedRoute><AdminPhrases /></ProtectedRoute>} />
            <Route path="/admin/emails" element={<ProtectedRoute><AdminEmails /></ProtectedRoute>} />
            <Route path="/admin/registration-documents" element={<ProtectedRoute><AdminRegistrationDocuments /></ProtectedRoute>} />
            <Route path="/admin/testing" element={<ProtectedRoute><TestingChecklist /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/seasons" element={<ProtectedRoute><Seasons /></ProtectedRoute>} />
            <Route
              path="/formateur/evaluations"
              element={
                <ProtectedRoute>
                  <FormateurOwnViewProvider>
                    <EvaluationsList />
                  </FormateurOwnViewProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/formateur/evaluations/:id/verifier"
              element={
                <ProtectedRoute>
                  <FormateurOwnViewProvider>
                    <EvaluationVerify />
                  </FormateurOwnViewProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/formateur/evaluation/:bookingId"
              element={
                <ProtectedRoute>
                  <FormateurOwnViewProvider>
                    <EvaluationForm />
                  </FormateurOwnViewProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/formateur/evaluation/:bookingId/edit"
              element={
                <ProtectedRoute>
                  <FormateurOwnViewProvider>
                    <EvaluationForm />
                  </FormateurOwnViewProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/formateur/evaluation-view/:evaluationId"
              element={
                <ProtectedRoute>
                  <FormateurOwnViewProvider>
                    <EvaluationView />
                  </FormateurOwnViewProvider>
                </ProtectedRoute>
              }
            />            <Route path="/amelioration" element={<ProtectedRoute><ContinuousImprovement /></ProtectedRoute>} />
            <Route path="/satisfaction-stats" element={<ProtectedRoute><SatisfactionStats /></ProtectedRoute>} />
            <Route path="/formateurs" element={<ProtectedRoute><InstructorsList /></ProtectedRoute>} />
            <Route path="/formateurs/:id" element={<ProtectedRoute><InstructorDetails /></ProtectedRoute>} />
            <Route path="/qualite/audit" element={<ProtectedRoute><QualiopiAudit /></ProtectedRoute>} />
            <Route path="/qualite/historique" element={<ProtectedRoute><AuditHistory /></ProtectedRoute>} />

            {/* Student portal routes */}
            <Route
              path="/student/dashboard"
              element={
                <StudentProtectedRoute>
                  <StudentOwnViewProvider>
                    <StudentDashboard />
                  </StudentOwnViewProvider>
                </StudentProtectedRoute>
              }
            />
            <Route
              path="/student/test"
              element={
                <StudentProtectedRoute>
                  <StudentOwnViewProvider>
                    <StudentTest />
                  </StudentOwnViewProvider>
                </StudentProtectedRoute>
              }
            />
            <Route
              path="/student/planning"
              element={
                <StudentProtectedRoute>
                  <StudentOwnViewProvider>
                    <StudentPlanning />
                  </StudentOwnViewProvider>
                </StudentProtectedRoute>
              }
            />
            <Route
              path="/student/documents"
              element={
                <StudentProtectedRoute>
                  <StudentOwnViewProvider>
                    <StudentDocuments />
                  </StudentOwnViewProvider>
                </StudentProtectedRoute>
              }
            />
            <Route
              path="/student/evaluation"
              element={
                <StudentProtectedRoute>
                  <StudentOwnViewProvider>
                    <StudentEvaluation />
                  </StudentOwnViewProvider>
                </StudentProtectedRoute>
              }
            />

            {/* Mode Assister — mêmes pages /student/* sous bandeau admin */}
            <Route
              path="/portails/stagiaire"
              element={<ProtectedRoute routeKey="portails.stagiaire"><PortalStudentPicker /></ProtectedRoute>}
            />
            <Route
              path="/portails/stagiaire/:studentId"
              element={
                <AssistStudentRoute>
                  <StudentAssistViewProvider>
                    <Outlet />
                  </StudentAssistViewProvider>
                </AssistStudentRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="test" element={<StudentTest />} />
              <Route path="planning" element={<StudentPlanning />} />
              <Route path="documents" element={<StudentDocuments />} />
              <Route path="evaluation" element={<StudentEvaluation />} />
            </Route>

            {/* Mode Assister formateur — évaluations filtrées */}
            <Route
              path="/portails/formateur"
              element={<ProtectedRoute routeKey="portails.formateur"><PortalFormateurPicker /></ProtectedRoute>}
            />
            <Route
              path="/portails/formateur/:instructorId"
              element={
                <AssistFormateurRoute>
                  <FormateurAssistViewProvider>
                    <Outlet />
                  </FormateurAssistViewProvider>
                </AssistFormateurRoute>
              }
            >
              <Route index element={<Navigate to="evaluations" replace />} />
              <Route path="evaluations" element={<EvaluationsList />} />
              <Route path="evaluations/:id/verifier" element={<EvaluationVerify />} />
              <Route path="evaluation/:bookingId" element={<EvaluationForm />} />
              <Route path="evaluation/:bookingId/edit" element={<EvaluationForm />} />
              <Route path="evaluation-view/:evaluationId" element={<EvaluationView />} />
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SeasonProvider>
    </LanguageProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
