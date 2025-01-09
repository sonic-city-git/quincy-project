import { Button } from "@/components/ui/button";
import { Pen, Plus } from "lucide-react";
import { AddRoleDialog } from "./AddRoleDialog";

interface RolesHeaderProps {
  projectId: string;
  onAddRole: (data: { roleId: string; dailyRate: string; hourlyRate: string }) => void;
  selectedItems: string[];
  onEdit: () => void;
}

export function RolesHeader({ projectId, onAddRole, selectedItems, onEdit }: RolesHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Roles</h2>
      <div className="flex items-center gap-2">
        {selectedItems.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onEdit}
            className="bg-zinc-900"
          >
            <Pen className="h-4 w-4" />
          </Button>
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