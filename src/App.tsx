import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layouts/AppLayout";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ProjectList from "@/pages/ProjectList";
import Planner from "@/pages/Planner";
import CrewList from "@/pages/CrewList";
import ProjectDetail from "@/pages/ProjectDetail";
import EquipmentList from "@/pages/EquipmentList";
import Resources from "@/pages/Resources";

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Index />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProjectDetail />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Planner />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/crew"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CrewList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <EquipmentList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Resources />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;