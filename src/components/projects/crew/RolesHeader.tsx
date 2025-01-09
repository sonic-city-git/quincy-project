import { Button } from "@/components/ui/button";
import { Pen, Plus } from "lucide-react";
import { AddRoleDialog } from "./AddRoleDialog";
import { EditRoleDialog } from "./edit/EditRoleDialog";
import { useState } from "react";

interface RolesHeaderProps {
  projectId: string;
  onAddRole: (data: { roleId: string; dailyRate: string; hourlyRate: string }) => void;
  onEditRole: (data: { dailyRate: string; hourlyRate: string }) => void;
  selectedItems: string[];
  selectedRole?: {
    name: string;
    dailyRate?: number | null;
    hourlyRate?: number | null;
  };
}

export function RolesHeader({ 
  projectId, 
  onAddRole, 
  onEditRole,
  selectedItems,
  selectedRole
}: RolesHeaderProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Roles</h2>
      <div className="flex items-center gap-2">
        {selectedItems.length > 0 && selectedRole && (
          <>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEditDialogOpen(true)}
              className="bg-zinc-900"
            >
              <Pen className="h-4 w-4" />
            </Button>
            <EditRoleDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onSubmit={onEditRole}
              initialData={selectedRole}
            />
          </>
        )}
        <AddRoleDialog
          projectId={projectId}
          onSubmit={onAddRole}
          trigger={
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add role
            </Button>
          }
        />
      </div>
    </div>
  );
}