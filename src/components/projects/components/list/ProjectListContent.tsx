// ProjectTable removed - using consolidated ProjectsTable instead
import { Table } from "@/components/ui/table";
import { TableHeader } from "../tables/TableHeader";
import { OwnerSection } from "./OwnerSection";
import { LoadingSpinner } from "@/components/resources/shared/LoadingSpinner";
import { Project } from "@/types/projects";
import { COMPONENT_CLASSES, cn } from "@/design-system";

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
    <div className={cn("flex-1 min-h-0 flex flex-col", COMPONENT_CLASSES.table.container)}>
      <div className={cn("sticky top-0 z-20", COMPONENT_CLASSES.table.header)}>
        <Table>
          <TableHeader />
        </Table>
      </div>
      <div className="overflow-y-auto flex-1">
        <div className="divide-y divide-border">
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