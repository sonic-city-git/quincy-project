import { ProjectRoleCard } from "./ProjectRoleCard";
import { Checkbox } from "@/components/ui/checkbox";

interface RolesListProps {
  projectRoles: any[];
  selectedItems: string[];
  onUpdate: () => void;
  onItemSelect: (projectRoleId: string) => void;
}

const roleOrder = ["FOH", "MON", "PLAYBACK", "BACKLINE"];

export function RolesList({ 
  projectRoles, 
  selectedItems, 
  onUpdate, 
  onItemSelect 
}: RolesListProps) {
  const sortedRoles = [...projectRoles].sort((a, b) => {
    const roleA = a.crew_roles.name.toUpperCase();
    const roleB = b.crew_roles.name.toUpperCase();
    
    const indexA = roleOrder.indexOf(roleA);
    const indexB = roleOrder.indexOf(roleB);
    
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return roleA.localeCompare(roleB);
  });

  return (
    <div className="grid gap-1.5">
      {sortedRoles?.map((projectRole) => (
        <div key={projectRole.id} className="flex items-center gap-2">
          <Checkbox
            checked={selectedItems.includes(projectRole.id)}
            onCheckedChange={() => onItemSelect(projectRole.id)}
          />
          <div className="flex-grow">
            <ProjectRoleCard
              id={projectRole.id}
              projectId={projectRole.project_id}
              roleId={projectRole.role_id}
              name={projectRole.crew_roles.name}
              color={projectRole.crew_roles.color}
              dailyRate={projectRole.daily_rate}
              hourlyRate={projectRole.hourly_rate}
              preferredId={projectRole.preferred_id}
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