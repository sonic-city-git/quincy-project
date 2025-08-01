import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TooltipProvider } from "@/components/ui/tooltip";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ProjectList from "@/pages/ProjectList";
import Planner from "@/pages/Planner";
import CrewList from "@/pages/CrewList";
import ProjectDetail from "@/pages/ProjectDetail";
import EquipmentList from "@/pages/EquipmentList";

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-zinc-950 text-white">
                  <Sidebar />
                  <main className="flex-1 overflow-auto">
                    <Routes>
                                              <Route path="/" element={<Index />} />
                        <Route path="/projects" element={<ProjectList />} />
                        <Route path="/projects/:id" element={<ProjectDetail />} />
                        <Route path="/planner" element={<Planner />} />
                        <Route path="/crew" element={<CrewList />} />
                        <Route path="/equipment" element={<EquipmentList />} />
                      {/* Preserve URL parameters when handling refresh */}
                      <Route path="*" element={<Navigate to={window.location.pathname} replace state={{ from: window.location }} />} />
                    </Routes>
                  </main>
                  <Toaster />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;