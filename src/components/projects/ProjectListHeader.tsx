import { ProjectSearchInput } from "./filters/ProjectSearchInput";
import { ProjectOwnerFilter } from "./filters/ProjectOwnerFilter";
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

  return (
    <div className="flex items-center justify-between gap-4">
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
      <Button
        variant="default"
        size="sm"
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