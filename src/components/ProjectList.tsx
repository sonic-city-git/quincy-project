import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectTable } from "./projects/ProjectTable";
import { ProjectListHeader } from "./projects/ProjectListHeader";
import { useProjectFilters } from "@/hooks/useProjectFilters";

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
            <div className="rounded-lg overflow-hidden border border-zinc-800 flex-1 min-h-0">
              <ProjectTable projects={filteredProjects} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}