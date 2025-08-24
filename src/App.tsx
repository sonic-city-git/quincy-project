import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layouts/AppLayout";
import { useGlobalKeyboard } from "@/hooks/global";

import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ProjectList from "@/pages/ProjectList";
import Planner from "@/pages/Planner";
import ProjectDetail from "@/pages/ProjectDetail";
import Resources from "@/pages/Resources";

function App() {
  // Global keyboard shortcuts (double ESC to dashboard)
  useGlobalKeyboard();
  


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
            path="/resources"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Resources />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          {/* Redirect old crew and equipment routes to unified resources page */}
          <Route path="/crew" element={<Navigate to="/resources" replace />} />
          <Route path="/equipment" element={<Navigate to="/resources" replace />} />
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;