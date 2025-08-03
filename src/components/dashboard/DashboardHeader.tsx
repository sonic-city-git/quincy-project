import { Search, X, User, Building, LayoutDashboard, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useOwnerOptions } from "@/hooks/useOwnerOptions";
import { useAuth } from "@/components/AuthProvider";

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const ownerSelectRef = useRef<HTMLButtonElement>(null);
  
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

  // Local search state for immediate UI feedback
  const [localSearchValue, setLocalSearchValue] = useState(filters.search || '');

  // Stable updateFilters function
  const updateFilters = useCallback((updates: Partial<DashboardFilters>) => {
    // Convert "all" values to empty strings for internal state
    const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key as keyof DashboardFilters] = value === 'all' ? '' : value;
      return acc;
    }, {} as Partial<DashboardFilters>);
    
    onFiltersChange({ ...filters, ...normalizedUpdates });
  }, [filters, onFiltersChange]);

  // Update local search when external filters change
  useEffect(() => {
    setLocalSearchValue(filters.search || '');
  }, [filters.search]);

  // Keyboard shortcuts: Cmd+K to focus, ESC to clear
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // ESC to clear search and filters and unfocus both fields
      if (event.key === 'Escape') {
        event.preventDefault();
        setLocalSearchValue('');
        onFiltersChange({
          search: '',
          owner: ''
        });
        searchInputRef.current?.blur();
        ownerSelectRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onFiltersChange]);

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
    filters.search || (activeTab === 'all' && filters.owner)
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
                ref={searchInputRef}
                placeholder="Search projects, crew, equipment..."
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                className={`pl-9 w-64 h-8 transition-colors ${
                  localSearchValue ? 'ring-2 ring-blue-500/50 border-blue-500/50 bg-blue-50/50' : ''
                }`}
              />
            </div>

            {/* Owner Filter - Only show on "All" tab */}
            {activeTab === 'all' && (
              <div className="flex items-center gap-1">
                <Select value={filters.owner || 'all'} onValueChange={(value) => updateFilters({ owner: value })}>
                  <SelectTrigger 
                    ref={ownerSelectRef}
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
            )}


          </div>
        </div>
        
        {/* Tab Toggle */}
        <div className="flex items-center gap-6">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === 'me' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('me')}
              className={`flex items-center gap-2 ${
                activeTab === 'me' ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <User className="h-4 w-4" />
              Me
            </Button>
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('all')}
              className={`flex items-center gap-2 ${
                activeTab === 'all' ? 'bg-purple-100 text-purple-700' : ''
              }`}
            >
              <Building className="h-4 w-4" />
              All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}