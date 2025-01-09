import { RolesHeader } from "./RolesHeader";
import { RatesList } from "./RatesList";
import { useProjectRoles } from "@/hooks/useProjectRoles";
import { EventsNeedingCrew } from "./EventsNeedingCrew";

interface RolesSectionProps {
  projectId: string;
}

export function RolesSection({ projectId }: RolesSectionProps) {
  const {
    projectRoles,
    selectedItems,
    selectedRole,
    handleItemSelect,
    handleAddRole,
    handleEditRole,
    refetchRoles
  } = useProjectRoles(projectId);

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/50 rounded-lg p-3">
        <RolesHeader 
          projectId={projectId}
          onAddRole={handleAddRole}
          onEditRole={handleEditRole}
          selectedItems={selectedItems}
          selectedRole={selectedRole}
        />
        <div className="grid gap-1.5">
          <RatesList
            projectRoles={projectRoles || []}
            selectedItems={selectedItems}
            onUpdate={() => refetchRoles()}
            onItemSelect={handleItemSelect}
          />
        </div>
      </div>
      
      <div className="bg-zinc-900/50 rounded-lg p-3">
        <EventsNeedingCrew projectId={projectId} />
      </div>
    </div>
  );
}