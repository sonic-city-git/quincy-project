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
    setSelectedItems,
    editMode,
    setEditMode,
    editValues,
    setEditValues,
    roles,
    projectRoles,
    handleAddRole,
    handleEditRole,
    handleDeleteRole,
    refetchProjectRoles
  } = useRoleManagement(projectId);

  const handleDialogClose = () => {
    setOpen(false);
    setEditMode(false);
    setEditValues(null);
  };

  const handleItemSelect = (roleId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((id) => id !== roleId);
      }
      return [...prev, roleId];
    });
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
            onItemSelect={handleItemSelect}
          />
        </div>
      </div>
    </div>
  );
}