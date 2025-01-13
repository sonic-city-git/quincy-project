import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ProjectList from "@/pages/ProjectList";
import ProjectDetail from "@/pages/ProjectDetail";
import CrewList from "@/pages/CrewList";
import EquipmentList from "@/pages/EquipmentList";
import Scheduling from "@/pages/Scheduling";

function App() {
  return (
    <AuthProvider>
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
      <Toaster />
    </AuthProvider>
  );
}

export default App;