import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddRoleDialog } from "./AddRoleDialog";
import { RoleSelectionActions } from "./RoleSelectionActions";

interface RolesHeaderProps {
  selectedItems: string[];
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: (data: {
    roleId: string;
    quantity: number;
    dailyRate: number;
    hourlyRate: number;
  }) => void;
  loading: boolean;
  editMode: boolean;
  editValues: {
    roleId: string;
    quantity: number;
    dailyRate: number;
    hourlyRate: number;
  } | null;
  roles: any[];
}

export function RolesHeader({
  selectedItems,
  onEdit,
  onDelete,
  open,
  onOpenChange,
  onClose,
  onSubmit,
  loading,
  editMode,
  editValues,
  roles,
}: RolesHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Roles</h2>
      <div className="flex items-center gap-2">
        <RoleSelectionActions
          selectedItems={selectedItems}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add role
            </Button>
          </DialogTrigger>
          <AddRoleDialog
            roles={roles}
            onClose={onClose}
            onSubmit={onSubmit}
            loading={loading}
            editMode={editMode}
            initialValues={editValues || undefined}
          />
        </Dialog>
      </div>
    </div>
  );
}