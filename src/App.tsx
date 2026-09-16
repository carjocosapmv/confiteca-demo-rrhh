import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import AppLayout from "@/components/AppLayout";
import { ProtectedModule } from "@/components/ProtectedModule";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import AdminUsuariosPage from "@/pages/AdminUsuariosPage";
import AdminPermisosPage from "@/pages/AdminPermisosPage";
import VacacionesDashboard from "@/pages/vacaciones/VacacionesDashboard";
import NuevaSolicitud from "@/pages/vacaciones/NuevaSolicitud";
import NuevoPermiso from "@/pages/vacaciones/NuevoPermiso";
import NuevaVacacion from "@/pages/vacaciones/NuevaVacacion";
import SolicitudesPage from "@/pages/vacaciones/SolicitudesPage";
import CalendarioPage from "@/pages/vacaciones/CalendarioPage";
import SaldosPage from "@/pages/vacaciones/SaldosPage";
import NotificacionesPage from "@/pages/vacaciones/NotificacionesPage";
import AusenciasRRHHDashboard from "@/pages/vacaciones/AusenciasRRHHDashboard";
import VacantesPage from "@/pages/vacantes/VacantesPage";
import OnboardingPage from "@/pages/onboarding/OnboardingPage";
import OnboardingRRHHPage from "@/pages/onboarding/OnboardingRRHHPage";
import InduccionColaborador from "@/pages/induccion/InduccionColaborador";
import InduccionFacilitador from "@/pages/induccion/InduccionFacilitador";
import InduccionTH from "@/pages/induccion/InduccionTH";
import DescriptivosPage from "@/pages/descriptivos/DescriptivosPage";
import RotacionDashboard from "@/pages/rotacion/RotacionDashboard";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-lg font-medium">Cuenta pendiente de activación</p>
          <p className="text-sm text-muted-foreground">
            Tu cuenta ha sido creada pero aún no tiene un rol asignado.
            Contacta al Super Administrador para que te asigne permisos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PermissionsProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin/usuarios" element={<ProtectedModule moduleKey="admin_usuarios"><AdminUsuariosPage /></ProtectedModule>} />
          <Route path="/admin/permisos" element={<ProtectedModule moduleKey="admin_permisos"><AdminPermisosPage /></ProtectedModule>} />
          <Route path="/vacaciones" element={<ProtectedModule moduleKey="vacaciones"><VacacionesDashboard /></ProtectedModule>} />
          <Route path="/vacaciones/nueva" element={<ProtectedModule moduleKey="vacaciones"><NuevaSolicitud /></ProtectedModule>} />
          <Route path="/vacaciones/nuevo-permiso" element={<ProtectedModule moduleKey="vacaciones"><NuevoPermiso /></ProtectedModule>} />
          <Route path="/vacaciones/nueva-vacacion" element={<ProtectedModule moduleKey="vacaciones"><NuevaVacacion /></ProtectedModule>} />
          <Route path="/vacaciones/solicitudes" element={<ProtectedModule moduleKey="vacaciones"><SolicitudesPage /></ProtectedModule>} />
          <Route path="/vacaciones/calendario" element={<ProtectedModule moduleKey="vacaciones"><CalendarioPage /></ProtectedModule>} />
          <Route path="/vacaciones/saldos" element={<ProtectedModule moduleKey="vacaciones"><SaldosPage /></ProtectedModule>} />
          <Route path="/vacaciones/notificaciones" element={<ProtectedModule moduleKey="vacaciones"><NotificacionesPage /></ProtectedModule>} />
          <Route path="/vacaciones/rrhh-dashboard" element={<ProtectedModule moduleKey="vacaciones"><AusenciasRRHHDashboard /></ProtectedModule>} />
          <Route path="/vacantes" element={<ProtectedModule moduleKey="vacantes"><VacantesPage /></ProtectedModule>} />
          <Route path="/onboarding" element={<ProtectedModule moduleKey="onboarding"><OnboardingPage /></ProtectedModule>} />
          <Route path="/onboarding/rrhh" element={<ProtectedModule moduleKey="onboarding"><OnboardingRRHHPage /></ProtectedModule>} />
          <Route path="/induccion" element={<ProtectedModule moduleKey="induccion"><InduccionColaborador /></ProtectedModule>} />
          <Route path="/induccion/facilitador" element={<ProtectedModule moduleKey="induccion"><InduccionFacilitador /></ProtectedModule>} />
          <Route path="/induccion/th" element={<ProtectedModule moduleKey="induccion"><InduccionTH /></ProtectedModule>} />
          <Route path="/descriptivos" element={<ProtectedModule moduleKey="vacantes"><DescriptivosPage /></ProtectedModule>} />
          <Route path="/rotacion" element={<ProtectedModule moduleKey="rotacion"><RotacionDashboard /></ProtectedModule>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PermissionsProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
