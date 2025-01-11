import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/Sidebar";
import Index from "@/pages/Index";
import ProjectList from "@/pages/ProjectList";
import CrewList from "@/pages/CrewList";
import ProjectDetail from "@/pages/ProjectDetail";
import EquipmentList from "@/pages/EquipmentList";

function App() {
  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/crew" element={<CrewList />} />
          <Route path="/equipment" element={<EquipmentList />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
}

export default App;