import { CrewSearchInput } from "./filters/CrewSearchInput";
import { CrewRoleFilter } from "./filters/CrewRoleFilter";
import { CrewFilterClear } from "./filters/CrewFilterClear";
import { CrewActions } from "./CrewActions";
import { AddMemberDialog } from "./AddMemberDialog";
import { CrewRole } from "@/hooks/useCrewRoles";

interface CrewListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roles: CrewRole[];
  selectedRoles: string[];
  onRoleToggle: (roleId: string) => void;
  onClearFilters: () => void;
  selectedItem: string | null;
  onCrewMemberDeleted: () => void;
}

export function CrewListHeader({
  searchQuery,
  onSearchChange,
  roles,
  selectedRoles,
  onRoleToggle,
  onClearFilters,
  selectedItem,
  onCrewMemberDeleted,
}: CrewListHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <CrewSearchInput 
          value={searchQuery}
          onChange={onSearchChange}
        />
        <CrewRoleFilter
          roles={roles}
          selectedRoles={selectedRoles}
          onRoleToggle={onRoleToggle}
        />
        {selectedRoles.length > 0 && (
          <CrewFilterClear onClear={onClearFilters} />
        )}
      </div>
      <CrewActions 
        selectedItems={selectedItem ? [selectedItem] : []} 
        onCrewMemberDeleted={onCrewMemberDeleted}
      />
      <AddMemberDialog />
    </div>
  );
}