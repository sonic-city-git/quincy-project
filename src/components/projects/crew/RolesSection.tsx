import { RolesHeader } from "./RolesHeader";
import { RatesList } from "./RatesList";
import { useProjectRoles } from "@/hooks/useProjectRoles";

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
    <div className="space-y-4">
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
    </div>
  );
}