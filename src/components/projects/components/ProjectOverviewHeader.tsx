import { ProjectSearchInput } from "./filters/ProjectSearchInput";
import { ProjectOwnerFilter } from "./filters/ProjectOwnerFilter";
import { ProjectFilterClear } from "./filters/ProjectFilterClear";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddProjectDialog } from "./dialogs/AddProjectDialog";
import { useCommonProjectTabActions } from "../../projectdetail/general/shared/hooks/useGeneralActions";

interface ProjectListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
}

export function ProjectListHeader({
  searchQuery,
  onSearchChange,
  ownerFilter,
  onOwnerFilterChange,
}: ProjectListHeaderProps) {
  // PERFORMANCE OPTIMIZATION: Use consolidated dialog state management
  const { addDialog } = useCommonProjectTabActions();
  const hasActiveFilters = ownerFilter || searchQuery;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <ProjectSearchInput 
          value={searchQuery}
          onChange={onSearchChange}
        />
        <div className="flex items-center gap-2">
          <ProjectOwnerFilter
            value={ownerFilter}
            onChange={onOwnerFilterChange}
          />
          {hasActiveFilters && (
            <ProjectFilterClear onClear={() => {
              onSearchChange('');
              onOwnerFilterChange('');
            }} />
          )}
        </div>
      </div>
      <Button
        variant="default"
        size="default"
        className="gap-2"
        onClick={() => addDialog.setActive(true)}
      >
        <Plus className="h-4 w-4" />
        Add Project
      </Button>
      <AddProjectDialog 
        open={addDialog.isActive}
        onOpenChange={addDialog.setActive}
      />
    </div>
  );
}