import { Button } from "@/components/ui/button";
import { Pen, Plus } from "lucide-react";
import { AddRoleDialog } from "./AddRoleDialog";
import { EditCrewMemberDialog } from "@/components/crew/EditCrewMemberDialog";
import { CrewMember } from "@/types/crew";

interface RolesHeaderProps {
  projectId: string;
  onAddRole: (data: { roleId: string; dailyRate: string; hourlyRate: string }) => void;
  selectedCrew?: CrewMember[];
  onEditCrewMember?: (member: CrewMember) => void;
}

export function RolesHeader({ 
  projectId, 
  onAddRole, 
  selectedCrew,
  onEditCrewMember 
}: RolesHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">Roles</h2>
      <div className="flex items-center gap-2">
        {selectedCrew && selectedCrew.length === 1 && onEditCrewMember && (
          <EditCrewMemberDialog
            selectedCrew={selectedCrew}
            onEditCrewMember={onEditCrewMember}
            onDeleteCrewMember={() => {}}
          />
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