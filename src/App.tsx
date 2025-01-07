import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Sidebar } from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import ProjectList from "@/pages/ProjectList";
import ProjectDetails from "@/pages/ProjectDetails";
import Equipment from "@/pages/Equipment";
import Crew from "@/pages/Crew";
import Customers from "@/pages/Customers";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/crew" element={<Crew />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/shortages" element={<div>Shortages</div>} />
          </Routes>
        </div>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
