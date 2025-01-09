import { RolesHeader } from "./RolesHeader";
import { RatesList } from "./RatesList";
import { useRoleManagement } from "@/hooks/useRoleManagement";

interface RolesSectionProps {
  projectId: string;
}

export function RolesSection({ projectId }: RolesSectionProps) {
  const {
    loading,
    open,
    setOpen,
    selectedItems,
    editMode,
    editValues,
    roles,
    projectRoles,
    handleAddRole,
    handleEditRole,
    handleDeleteRole,
  } = useRoleManagement(projectId);

  const handleDialogClose = () => {
    setOpen(false);
    editMode && setEditMode(false);
    editValues && setEditValues(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 rounded-lg p-3">
        <RolesHeader
          selectedItems={selectedItems}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          open={open}
          onOpenChange={setOpen}
          onClose={handleDialogClose}
          onSubmit={handleAddRole}
          loading={loading}
          editMode={editMode}
          editValues={editValues}
          roles={roles || []}
        />
        <div className="grid gap-1.5">
          <RatesList
            projectRoles={projectRoles || []}
            selectedItems={selectedItems}
            onUpdate={refetchProjectRoles}
          />
        </div>
      </div>
    </div>
  );
}