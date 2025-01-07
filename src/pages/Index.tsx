import { ProjectList } from "@/components/ProjectList";

const Index = () => {
  return (
    <main className="flex-1 p-8 bg-zinc-900 text-white">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-200">Projects</h1>
      </div>
      <ProjectList />
    </main>
  );
};

export default Index;