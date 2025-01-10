import { ProjectSearchInput } from "./filters/ProjectSearchInput";
import { ProjectActions } from "./ProjectActions";

interface ProjectListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedItem: string | null;
  onProjectDeleted: () => void;
}

export function ProjectListHeader({
  searchQuery,
  onSearchChange,
  selectedItem,
  onProjectDeleted,
}: ProjectListHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <ProjectSearchInput 
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      <ProjectActions 
        selectedItems={selectedItem ? [selectedItem] : []} 
        onProjectDeleted={onProjectDeleted}
      />
    </div>
  );
}