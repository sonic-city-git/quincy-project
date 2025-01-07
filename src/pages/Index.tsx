import { Sidebar } from "@/components/Sidebar";
import { ProjectList } from "@/components/ProjectList";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-zinc-900 text-white">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-200">Projects</h1>
        </div>
        <ProjectList />
      </main>
    </div>
  );
};

export default Index;