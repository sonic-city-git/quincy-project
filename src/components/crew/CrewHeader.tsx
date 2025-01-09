import { AddCrewMemberDialog } from "./AddCrewMemberDialog";
import { FilterButton } from "./filter/FilterButton";
import { NewCrewMember, CrewMember } from "@/types/crew";
import { CrewSearch } from "./search/CrewSearch";
import { EditCrewMemberDialog } from "./EditCrewMemberDialog";

interface CrewHeaderProps {
  selectedCount: number;
  onAddCrewMember: (newMember: NewCrewMember) => void;
  onEditCrewMember: (member: CrewMember) => void;
  selectedRoles: string[];
  allRoles: string[];
  onRoleSelect: (role: string, checked: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCrew: CrewMember[];
}

export function CrewHeader({ 
  onAddCrewMember,
  onEditCrewMember,
  selectedRoles,
  allRoles,
  onRoleSelect,
  searchTerm,
  onSearchChange,
  selectedCrew
}: CrewHeaderProps) {
  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex items-center gap-4">
        <FilterButton 
          selectedRoles={selectedRoles}
          allRoles={allRoles}
          onRoleSelect={onRoleSelect}
        />
        <CrewSearch 
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
        />
      </div>
      <div className="flex items-center gap-4">
        {selectedCrew.length === 1 && (
          <EditCrewMemberDialog 
            selectedCrew={selectedCrew}
            onEditCrewMember={onEditCrewMember}
            onDeleteCrewMember={() => {}}
          />
        )}
        <AddCrewMemberDialog onAddCrewMember={onAddCrewMember} />
      </div>
    </div>
  );
}