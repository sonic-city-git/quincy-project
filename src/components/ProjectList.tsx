import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectTable } from "./projects/ProjectTable";
import { ProjectListHeader } from "./projects/ProjectListHeader";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import { Table } from "./ui/table";
import { TableHeader } from "./projects/TableHeader";

export function ProjectList() {
  const { projects, loading } = useProjects();
  const {
    searchQuery,
    setSearchQuery,
    ownerFilter,
    setOwnerFilter,
    filteredProjects
  } = useProjectFilters(projects);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group projects by owner
  const groupedProjects = filteredProjects.reduce((acc, project) => {
    const ownerName = project.owner?.name || 'No Owner';
    if (!acc[ownerName]) {
      acc[ownerName] = [];
    }
    acc[ownerName].push(project);
    return acc;
  }, {} as Record<string, typeof filteredProjects>);

  // Sort owner names alphabetically
  const sortedOwners = Object.keys(groupedProjects).sort((a, b) => a.localeCompare(b));

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
            <div className="rounded-lg overflow-hidden border border-zinc-800 flex-1 min-h-0 flex flex-col">
              <div className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800">
                <Table>
                  <TableHeader />
                </Table>
              </div>
              <div className="overflow-y-auto flex-1">
                <div className="divide-y divide-zinc-800">
                  {sortedOwners.map((ownerName) => (
                    <div key={ownerName}>
                      <div className="bg-zinc-800/50 px-4 py-2 font-medium text-sm text-zinc-400">
                        {ownerName}
                      </div>
                      <ProjectTable projects={groupedProjects[ownerName]} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}