import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectTable } from "./projects/ProjectTable";
import { ProjectListHeader } from "./projects/ProjectListHeader";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import { Table } from "./ui/table";
import { TableHeader } from "./projects/TableHeader";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

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
      acc[ownerName] = {
        name: ownerName,
        avatar_url: project.owner?.avatar_url,
        projects: []
      };
    }
    acc[ownerName].projects.push(project);
    return acc;
  }, {} as Record<string, { name: string; avatar_url?: string; projects: typeof filteredProjects }>);

  // Sort owner names alphabetically
  const sortedOwners = Object.values(groupedProjects).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

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
                  {sortedOwners.map((owner) => (
                    <div key={owner.name}>
                      <div className="bg-zinc-800/50 px-4 py-2 font-medium text-sm text-zinc-400">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {owner.avatar_url ? (
                              <AvatarImage 
                                src={owner.avatar_url} 
                                alt={owner.name} 
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                                {getInitials(owner.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span>{owner.name}</span>
                        </div>
                      </div>
                      <ProjectTable projects={owner.projects} />
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