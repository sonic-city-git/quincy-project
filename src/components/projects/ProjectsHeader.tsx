import { Search, X, Clock, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useProjects } from "@/hooks/useProjects";

// Filter types
export interface ProjectFilters {
  search: string;
  owner: string;
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
  const ownerOptions = useMemo(() => {
    if (!projects) return [];
    const ownerMap = new Map<string, { name: string; avatar_url: string | null; id: string }>();
    
    projects.forEach(project => {
      if (project.owner?.name && !ownerMap.has(project.owner.name)) {
        ownerMap.set(project.owner.name, {
          name: project.owner.name,
          avatar_url: project.owner.avatar_url,
          id: project.owner.id
        });
      }
    });
    
    return Array.from(ownerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  // Local search state for immediate UI feedback
  const [localSearchValue, setLocalSearchValue] = useState(filters.search || '');

  // Stable updateFilters function
  const updateFilters = useCallback((updates: Partial<ProjectFilters>) => {
    // Convert "all" values to empty strings for internal state
    const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key as keyof ProjectFilters] = value === 'all' ? '' : value;
      return acc;
    }, {} as Partial<ProjectFilters>);
    
    onFiltersChange({ ...filters, ...normalizedUpdates });
  }, [filters, onFiltersChange]);

  // Update local search when external filters change
  useEffect(() => {
    setLocalSearchValue(filters.search || '');
  }, [filters.search]);

  // Debounced search to prevent lag
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchValue !== filters.search) {
        updateFilters({ search: localSearchValue });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchValue, filters.search, updateFilters]);

  // Filter helpers
  const hasActiveFilters = (
    filters.search
  );

  const clearAllFilters = () => {
    setLocalSearchValue(''); // Clear local search state too
    onFiltersChange({
      search: '',
      owner: ''
    });
  };

  return (
    <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm">
      {/* Header with Title, Filters, and Tab Toggle */}
      <div className="flex items-center justify-between py-3 px-4 bg-background border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${iconColor}`} />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          
          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                className="pl-9 w-56 h-8"
              />
            </div>

            {/* Owner Filter */}
            <div className="flex items-center gap-1">
              <Select value={filters.owner || 'all'} onValueChange={(value) => updateFilters({ owner: value })}>
                <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs bg-muted/50 border-border/50 hover:bg-muted transition-colors">
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

              {/* Clear Owner Button */}
              {filters.owner && filters.owner !== 'all' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => updateFilters({ owner: 'all' })}
                  title="Clear owner filter"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1">
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    Search: {filters.search.slice(0, 10)}{filters.search.length > 10 ? '...' : ''}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => {
                        setLocalSearchValue('');
                        updateFilters({ search: '' });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Add Button and Tab Toggle */}
        <div className="flex items-center gap-6">
          <Button size="sm" className="gap-1 h-6 px-1.5 text-xs" onClick={onAddClick}>
            <Plus className="h-3 w-3" />
            Add Project
          </Button>
          
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('active')}
              className={`flex items-center gap-2 ${
                activeTab === 'active' ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <Clock className="h-4 w-4" />
              Active
            </Button>
            <Button
              variant={activeTab === 'archived' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('archived')}
              className={`flex items-center gap-2 ${
                activeTab === 'archived' ? 'bg-green-100 text-green-700' : ''
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Archived
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}