import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ResourceType } from "../types/resource";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResourceFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedType: ResourceType | null;
  onTypeChange: (type: ResourceType | null) => void;
  onClearFilters: () => void;
}

export function ResourceFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  onClearFilters,
}: ResourceFiltersProps) {
  const hasFilters = searchQuery || selectedType;

  return (
    <div className="flex items-center gap-4">
      <div className="flex w-full max-w-sm items-center gap-4">
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9"
        />
        <Select
          value={selectedType || ""}
          onValueChange={(value) => onTypeChange(value ? value as ResourceType : null)}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value={ResourceType.CREW}>Crew</SelectItem>
            <SelectItem value={ResourceType.EQUIPMENT}>Equipment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 px-2"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}