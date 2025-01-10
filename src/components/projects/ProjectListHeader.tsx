import { ProjectSearchInput } from "./filters/ProjectSearchInput";
import { ProjectActions } from "./ProjectActions";
import { ViewToggle } from "./ViewToggle";

interface ProjectListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedItem: string | null;
  onProjectDeleted: () => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

export function ProjectListHeader({
  searchQuery,
  onSearchChange,
  selectedItem,
  onProjectDeleted,
  viewMode,
  onViewModeChange,
}: ProjectListHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <ProjectSearchInput 
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      <ViewToggle currentView={viewMode} onViewChange={onViewModeChange} />
      <ProjectActions 
        selectedItems={selectedItem ? [selectedItem] : []} 
        onProjectDeleted={onProjectDeleted}
      />
    </div>
  );
}