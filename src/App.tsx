import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ProjectList from "@/pages/ProjectList";
import ProjectDetail from "@/pages/ProjectDetail";
import CrewList from "@/pages/CrewList";
import EquipmentList from "@/pages/EquipmentList";
import Scheduling from "@/pages/Scheduling";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>}>
              <Route index element={<ProjectList />} />
              <Route path="projects/:id/*" element={<ProjectDetail />} />
              <Route path="crew" element={<CrewList />} />
              <Route path="equipment" element={<EquipmentList />} />
              <Route path="scheduling" element={<Scheduling />} />
            </Route>
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;