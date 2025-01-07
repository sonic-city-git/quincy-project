import { ProjectActions } from "./projects/ProjectActions";
import { ProjectTable } from "./projects/ProjectTable";
import { useProjects } from "@/hooks/useProjects";

export function ProjectList() {
  const { projects, loading } = useProjects();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <ProjectActions />
      <ProjectTable projects={projects} />
    </div>
  );
}