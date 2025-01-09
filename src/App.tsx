import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "./components/ui/toaster";
import Dashboard from "./pages/Dashboard";
import ProjectList from "./pages/ProjectList";
import ProjectDetails from "./pages/ProjectDetails";
import Customers from "./pages/Customers";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/customers" element={<Customers />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </Router>
  );
}

export default App;