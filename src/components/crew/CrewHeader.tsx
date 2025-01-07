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
      <FilterButton 
        selectedRoles={selectedRoles}
        allRoles={allRoles}
        onRoleSelect={onRoleSelect}
      />
      <AddCrewMemberDialog onAddCrewMember={onAddCrewMember} />
    </div>
  );
}