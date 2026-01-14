import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Inscriptions from "./pages/Inscriptions";
import Students from "./pages/Students";
import PlacementTests from "./pages/PlacementTests";
import Classes from "./pages/Classes";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import Import from "./pages/admin/Import";
import Register from "./pages/register/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected admin routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/inscriptions" element={<ProtectedRoute><Inscriptions /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/tests" element={<ProtectedRoute><PlacementTests /></ProtectedRoute>} />
          <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
