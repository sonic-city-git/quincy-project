import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddRoleDialog } from "./AddRoleDialog";

interface RolesHeaderProps {
  projectId: string;
  onAddRole: (data: { roleId: string; dailyRate: string; hourlyRate: string }) => void;
}

export function RolesHeader({ projectId, onAddRole }: RolesHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Roles</h2>
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
  );
}