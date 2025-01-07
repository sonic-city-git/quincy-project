import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import Equipment from "@/pages/Equipment";

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/equipment" element={<Equipment />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;