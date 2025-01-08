import { ProjectRoleCard } from "./ProjectRoleCard";
import { Checkbox } from "@/components/ui/checkbox";

interface RolesListProps {
  projectRoles: any[];
  selectedItems: string[];
  onItemSelect: (roleId: string) => void;
  onUpdate: () => void;
}

export function RolesList({ projectRoles, selectedItems, onItemSelect, onUpdate }: RolesListProps) {
  return (
    <div className="grid gap-1.5">
      {projectRoles?.map((projectRole) => (
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
      {projectRoles?.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          No roles added to this project yet
        </div>
      )}
    </div>
  );
}