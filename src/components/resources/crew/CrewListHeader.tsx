import { CrewSearchInput } from "./filters/CrewSearchInput";
import { CrewRoleFilter } from "./filters/CrewRoleFilter";
import { CrewFilterClear } from "./filters/CrewFilterClear";
import { CrewActions } from "./CrewActions";
import { AddMemberDialog } from "./AddMemberDialog";
import { CrewRole } from "@/hooks/crew";

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
  const hasActiveFilters = selectedRoles.length > 0 || searchQuery.length > 0;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <CrewSearchInput 
          value={searchQuery}
          onChange={onSearchChange}
        />
        <div className="flex items-center gap-2">
          <CrewRoleFilter
            roles={roles}
            selectedRoles={selectedRoles}
            onRoleToggle={onRoleToggle}
          />
          {hasActiveFilters && (
            <CrewFilterClear onClear={onClearFilters} />
          )}
        </div>
      </div>
      <CrewActions 
        selectedItems={selectedItem ? [selectedItem] : []} 
        onCrewMemberDeleted={onCrewMemberDeleted}
      />
      <AddMemberDialog />
    </div>
  );
}