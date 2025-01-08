import { AddCrewMemberDialog } from "./AddCrewMemberDialog";
import { FilterButton } from "./filter/FilterButton";
import { NewCrewMember } from "@/types/crew";
import { CrewSearch } from "./search/CrewSearch";

interface CrewHeaderProps {
  selectedCount: number;
  onAddCrewMember: (newMember: NewCrewMember) => void;
  selectedRoles: string[];
  allRoles: string[];
  onRoleSelect: (role: string, checked: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function CrewHeader({ 
  onAddCrewMember,
  selectedRoles,
  allRoles,
  onRoleSelect,
  searchTerm,
  onSearchChange
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
      <div className="flex items-center gap-4">
        <CrewSearch 
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
        <AddCrewMemberDialog onAddCrewMember={onAddCrewMember} />
      </div>
    </div>
  );
}