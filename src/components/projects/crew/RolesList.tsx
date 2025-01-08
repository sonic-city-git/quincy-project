import { ProjectRoleCard } from "./ProjectRoleCard";
import { Checkbox } from "@/components/ui/checkbox";

interface RolesListProps {
  projectRoles: any[];
  selectedItems: string[];
  onItemSelect: (roleId: string) => void;
  onUpdate: () => void;
}

const roleOrder = ["FOH", "MON", "PLAYBACK", "BACKLINE"];

export function RolesList({ projectRoles, selectedItems, onItemSelect, onUpdate }: RolesListProps) {
  const sortedRoles = [...projectRoles].sort((a, b) => {
    const roleA = a.crew_roles.name.toUpperCase();
    const roleB = b.crew_roles.name.toUpperCase();
    
    const indexA = roleOrder.indexOf(roleA);
    const indexB = roleOrder.indexOf(roleB);
    
    // If both roles are in our predefined order, sort by that
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only one role is in our predefined order, prioritize it
    if (indexA !== -1) return -1; 1;
    
    // For roles not in our predefined order, sort alphabetically
    return roleA.localeCompare(roleB);
  });

  return (
    <div className="grid gap-1.5">
      {sortedRoles?.map((projectRole) => (
        <div key={projectRole.id} className="flex items-center gap-2">
          <Checkbox
            checked={selectedItems.includes(projectRole.role_id)}
            onCheckedChange={() => onItemSelect(projectRole.role_id)}
          />
          <div className="flex-grow">
            <ProjectRoleCard
              id={projectRole.role_id}
              projectId={projectRole.project_id}
              name={projectRole.crew_roles.name}
              color={projectRole.crew_roles.color}
              dailyRate={projectRole.daily_rate}
              hourlyRate={projectRole.hourly_rate}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      ))}
      {sortedRoles?.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No roles added to this project yet
        </div>
      )}
    </div>
  );
}