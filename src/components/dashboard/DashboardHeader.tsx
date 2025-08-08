import { User, Building } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/project";
import { useOwnerOptions } from "@/hooks/ui";
import { useAuth } from "@/components/AuthProvider";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { Tab } from "@/components/shared/SectionHeader";

// Filter types
export interface DashboardFilters {
  search: string;
  owner: string;
}

interface DashboardHeaderProps {
  activeTab: 'me' | 'all';
  onTabChange: (tab: 'me' | 'all') => void;
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export function DashboardHeader({
  activeTab,
  onTabChange,
  filters,
  onFiltersChange
}: DashboardHeaderProps) {
  const { session } = useAuth();

  // Dynamic content based on dashboard tab
  const getTabConfig = () => {
    switch (activeTab) {
      case 'me':
        return { title: 'My Dashboard', icon: User, color: 'text-blue-500' };
      default:
        return { title: 'Company Dashboard', icon: Building, color: 'text-purple-500' };
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
  const tabs: Tab<'me' | 'all'>[] = [
    { value: 'me', label: 'Me', icon: User, color: 'text-blue-500' },
    { value: 'all', label: 'All', icon: Building, color: 'text-purple-500' }
  ];

  // Update filters helper
  const updateFilters = (updates: Partial<DashboardFilters>) => {
    // Convert "all" values to empty strings for internal state
    const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key as keyof DashboardFilters] = value === 'all' ? '' : value;
      return acc;
    }, {} as Partial<DashboardFilters>);
    
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
        placeholder: "Search projects, crew, equipment...",
        value: filters.search,
        onChange: (value) => updateFilters({ search: value })
      }}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={clearAllFilters}
    >
      {/* Owner Filter - Only show on "All" tab */}
      {activeTab === 'all' && (
        <div className="flex items-center gap-1">
          <Select value={filters.owner || 'all'} onValueChange={(value) => updateFilters({ owner: value })}>
            <SelectTrigger 
              className={`w-auto min-w-[140px] h-8 text-xs bg-muted/50 border-border/50 hover:bg-muted transition-colors ${
                filters.owner && filters.owner !== 'all' ? 'ring-2 ring-purple-500/50 border-purple-500/50 bg-purple-50/50' : ''
              }`}
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
      )}
    </SectionHeader>
  );
}