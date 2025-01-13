import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { useProjects } from "@/hooks/useProjects";
import { ProjectListHeader } from "./projects/ProjectListHeader";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import { ProjectListContent } from "./projects/list/ProjectListContent";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const {
    searchQuery,
    setSearchQuery,
    ownerFilter,
    setOwnerFilter,
    filteredProjects
  } = useProjectFilters(projects);

  // Group projects by owner
  const groupedProjects = filteredProjects.reduce((acc, project) => {
    const ownerName = project.owner?.name || 'No Owner';
    if (!acc[ownerName]) {
      acc[ownerName] = {
        name: ownerName,
        avatar_url: project.owner?.avatar_url,
        projects: []
      };
    }
    acc[ownerName].projects.push(project);
    return acc;
  }, {} as Record<string, { name: string; avatar_url?: string; projects: typeof filteredProjects }>);

  return (
    <div className="h-[calc(100vh-2rem)] py-6">
      <Card className="border-0 shadow-md bg-zinc-900/50 h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="space-y-6 h-full flex flex-col">
            <ProjectListHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              ownerFilter={ownerFilter}
              onOwnerFilterChange={setOwnerFilter}
            />
            <Separator className="bg-zinc-800" />
            <ProjectListContent 
              loading={loading}
              groupedProjects={groupedProjects}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}