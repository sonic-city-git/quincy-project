import { RolesHeader } from "./RolesHeader";
import { RatesList } from "./RatesList";
import { useRoleManagement } from "@/hooks/useRoleManagement";
import { Dialog } from "@/components/ui/dialog";
import { AddRoleDialog } from "./AddRoleDialog";
import { EditRoleDialog } from "./EditRoleDialog";

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

  const handleEdit = (roleId: string) => {
    setEditMode(true);
    setOpen(true);
    handleEditRole(roleId);
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900/50 rounded-lg p-3">
        <RolesHeader
          selectedItems={selectedItems}
          onEdit={handleEdit}
          onDelete={handleDeleteRole}
          open={open}
          onOpenChange={setOpen}
          onClose={handleDialogClose}
          onSubmit={handleAddRole}
          loading={loading}
          roles={roles || []}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          {editMode ? (
            <EditRoleDialog
              projectId={projectId}
              roleId={selectedItems[0]}
              onClose={handleDialogClose}
              onSubmit={handleEditRole}
              onDelete={() => handleDeleteRole(selectedItems[0])}
              loading={loading}
            />
          ) : (
            <AddRoleDialog
              roles={roles || []}
              onClose={handleDialogClose}
              onSubmit={handleAddRole}
              loading={loading}
            />
          )}
        </Dialog>
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