import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import Equipment from "@/pages/Equipment";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Crew from "@/pages/Crew";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-zinc-900">
        <Sidebar />
        <div className="flex-1 pl-sidebar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Index />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/crew" element={<Crew />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;