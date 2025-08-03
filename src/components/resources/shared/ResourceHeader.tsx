import { Button } from "@/components/ui/button";
import { ResourceType } from "../types/resource";
import { ResourceFilters } from "./ResourceFilters";
import { ResourceActions } from "./ResourceActions";

interface ResourceHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedType: ResourceType | null;
  onTypeChange: (type: ResourceType | null) => void;
  onClearFilters: () => void;
  onAddResource: () => void;
  selectedItemId: string | null;
}

export function ResourceHeader({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  onClearFilters,
  onAddResource,
  selectedItemId,
}: ResourceHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 pb-4">
      <div className="flex items-center gap-4 flex-1">
        <ResourceFilters
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedType={selectedType}
          onTypeChange={onTypeChange}
          onClearFilters={onClearFilters}
        />
      </div>
      <div className="flex items-center gap-2">
        {selectedItemId && (
          <ResourceActions selectedItemId={selectedItemId} />
        )}
        <Button onClick={onAddResource}>
          Add Resource
        </Button>
      </div>
    </div>
  );
}