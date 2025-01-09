import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import ProjectList from "@/pages/ProjectList";

function App() {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      <Sidebar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects" element={<ProjectList />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;