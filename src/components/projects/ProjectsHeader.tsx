import { Clock, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { useOwnerOptions } from "@/hooks/useOwnerOptions";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { Tab } from "@/components/shared/SectionHeader";
import { OwnerFilters } from "@/types/ui-common";
import { COMPONENT_CLASSES, cn } from "@/design-system";

// Consolidated filter types using common interface
export interface ProjectFilters extends OwnerFilters {
  // Project-specific filters can be added here
}

interface ProjectsHeaderProps {
  activeTab: 'active' | 'archived';
  onTabChange: (tab: 'active' | 'archived') => void;
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onAddClick?: () => void;
}

export function ProjectsHeader({
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  onAddClick
}: ProjectsHeaderProps) {
  // Dynamic content based on project tab
  const getTabConfig = () => {
    switch (activeTab) {
      case 'archived':
        return { title: 'Archived Projects', icon: CheckCircle, color: 'text-green-500' };
      default:
        return { title: 'Active Projects', icon: Clock, color: 'text-blue-500' };
    }
  };

  const { title, icon: IconComponent, color: iconColor } = getTabConfig();

  // Get dynamic data from projects
  const { projects } = useProjects();

  // Extract unique owners from actual project data with avatars
  const ownerOptions = useOwnerOptions(projects, { 
    keyBy: 'name', 
    includeAvatars: true 
  });

  // Tab configuration
  const tabs: Tab<'active' | 'archived'>[] = [
    { value: 'active', label: 'Active', icon: Clock, color: 'text-blue-500' },
    { value: 'archived', label: 'Archived', icon: CheckCircle, color: 'text-green-500' }
  ];

  // Update filters helper
  const updateFilters = (updates: Partial<ProjectFilters>) => {
    // Convert "all" values to empty strings for internal state
    const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key as keyof ProjectFilters] = value === 'all' ? '' : value;
      return acc;
    }, {} as Partial<ProjectFilters>);
    
    onFiltersChange({ ...filters, ...normalizedUpdates });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      owner: ''
    });
  };

  return (
    <SectionHeader
      header={{
        title,
        icon: IconComponent,
        iconColor
      }}
      tabs={{
        activeTab,
        onTabChange,
        options: tabs
      }}
      search={{
        placeholder: "Search projects...",
        value: filters.search,
        onChange: (value) => updateFilters({ search: value })
      }}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={clearAllFilters}
      actions={
        onAddClick && (
          <Button
            onClick={onAddClick}
            size="sm"
            className={cn("h-7 sm:h-8 px-1.5 sm:px-2 md:px-3 text-xs whitespace-nowrap", COMPONENT_CLASSES.button.primary)}
            title="Add Project"
          >
            <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span className="hidden md:inline ml-1 sm:ml-1.5">Add Project</span>
          </Button>
        )
      }
    >
      {/* Owner Filter */}
      <div className="flex items-center gap-1">
        <Select value={filters.owner || 'all'} onValueChange={(value) => updateFilters({ owner: value })}>
          <SelectTrigger 
            className={cn(
              "w-auto min-w-[140px] h-8 text-xs",
              COMPONENT_CLASSES.input.filter,
              filters.owner && filters.owner !== 'all' && "ring-2 ring-primary/50 border-primary/50"
            )}
          >
            <div className="flex items-center gap-2">
              {filters.owner && filters.owner !== 'all' ? (
                <>
                  {(() => {
                    const selectedOwner = ownerOptions.find(o => o.name === filters.owner);
                    return selectedOwner?.avatar_url ? (
                      <img
                        src={selectedOwner.avatar_url}
                        alt={selectedOwner.name}
                        className="h-4 w-4 rounded-full ring-1 ring-border shadow-sm"
                      />
                    ) : (
                      <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {selectedOwner?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    );
                  })()}
                  <span>{filters.owner}</span>
                </>
              ) : (
                <span>All Owners</span>
              )}
            </div>
          </SelectTrigger>
          <SelectContent className="w-[200px]">
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">All</span>
                </div>
                <span>All Owners</span>
              </div>
            </SelectItem>
            {ownerOptions.map(owner => (
              <SelectItem key={owner.name} value={owner.name}>
                <div className="flex items-center gap-2">
                  {owner.avatar_url ? (
                    <img
                      src={owner.avatar_url}
                      alt={owner.name}
                      className="h-5 w-5 rounded-full ring-1 ring-border shadow-sm"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {owner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span>{owner.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </SectionHeader>
  );
}