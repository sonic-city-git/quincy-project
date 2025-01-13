import { ProjectSearchInput } from "./filters/ProjectSearchInput";
import { ProjectOwnerFilter } from "./filters/ProjectOwnerFilter";
import { ProjectFilterClear } from "./filters/ProjectFilterClear";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddProjectDialog } from "./AddProjectDialog";

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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
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
        onClick={() => setAddDialogOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Project
      </Button>
      <AddProjectDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}