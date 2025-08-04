import { ProjectTable } from "../ProjectTable";
import { Table } from "@/components/ui/table";
import { TableHeader } from "../TableHeader";
import { OwnerSection } from "./OwnerSection";
import { LoadingSpinner } from "@/components/resources/shared/LoadingSpinner";
import { Project } from "@/types/projects";

interface ProjectListContentProps {
  loading: boolean;
  groupedProjects: Record<string, { 
    name: string; 
    avatar_url?: string; 
    projects: Project[] 
  }>;
}

export function ProjectListContent({ loading, groupedProjects }: ProjectListContentProps) {
  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  if (!groupedProjects || Object.keys(groupedProjects).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No projects found
      </div>
    );
  }

  // Sort owner names alphabetically
  const sortedOwners = Object.values(groupedProjects).sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-800 flex-1 min-h-0 flex flex-col">
      <div className="sticky top-0 z-20 bg-zinc-900 border-b border-zinc-800">
        <Table>
          <TableHeader />
        </Table>
      </div>
      <div className="overflow-y-auto flex-1">
        <div className="divide-y divide-zinc-800">
          {sortedOwners.map((owner) => (
            <OwnerSection 
              key={owner.name} 
              owner={owner} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}