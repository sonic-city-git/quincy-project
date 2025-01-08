import { AddCrewMemberDialog } from "./AddCrewMemberDialog";
import { FilterButton } from "./filter/FilterButton";
import { NewCrewMember } from "@/types/crew";

interface CrewHeaderProps {
  selectedCount: number;
  onAddCrewMember: (newMember: NewCrewMember) => void;
  selectedRoles: string[];
  allRoles: string[];
  onRoleSelect: (role: string, checked: boolean) => void;
}

export function CrewHeader({ 
  onAddCrewMember,
  selectedRoles,
  allRoles,
  onRoleSelect
}: CrewHeaderProps) {
  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-4">
        <FilterButton 
          selectedRoles={selectedRoles}
          allRoles={allRoles}
          onRoleSelect={onRoleSelect}
        />
      </div>
      <AddCrewMemberDialog onAddCrewMember={onAddCrewMember} />
    </div>
  );
}