import { ProjectSearchInput } from "./filters/ProjectSearchInput";
import { ProjectActions } from "./ProjectActions";
import { ProjectOwnerFilter } from "./filters/ProjectOwnerFilter";

interface ProjectListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedItem: string | null;
  onProjectDeleted: () => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
}

export function ProjectListHeader({
  searchQuery,
  onSearchChange,
  selectedItem,
  onProjectDeleted,
  ownerFilter,
  onOwnerFilterChange,
}: ProjectListHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <ProjectSearchInput 
          value={searchQuery}
          onChange={onSearchChange}
        />
        <ProjectOwnerFilter
          value={ownerFilter}
          onChange={onOwnerFilterChange}
        />
      </div>
      <ProjectActions 
        selectedItems={selectedItem ? [selectedItem] : []} 
        onProjectDeleted={onProjectDeleted}
      />
    </div>
  );
}