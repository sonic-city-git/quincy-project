import { Search, Filter, X, Package, Users, Database, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState, useEffect, useCallback } from "react";

// Filter types
export interface ResourceFilters {
  search: string;
  equipmentType: string;
  crewRole: string;
}

interface ResourcesHeaderProps {
  activeTab: 'equipment' | 'crew';
  onTabChange: (tab: 'equipment' | 'crew') => void;
  filters: ResourceFilters;
  onFiltersChange: (filters: ResourceFilters) => void;
  onAddClick?: () => void;
}

export function ResourcesHeader({
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  onAddClick
}: ResourcesHeaderProps) {
  // Dynamic content based on resource type
  const isCrewTab = activeTab === 'crew';
  const title = isCrewTab ? 'Crew Management' : 'Equipment Management';
  const icon = isCrewTab ? Users : Package;
  const IconComponent = icon;
  const iconColor = isCrewTab ? 'text-orange-500' : 'text-green-500';

  // Predefined filters
  const equipmentTypes = ['Mixers', 'Microphones', 'Speakers', 'Lighting', 'Video', 'Cables', 'Stage', 'Other'];
  const crewRoles = ['Sound Engineer', 'Lighting Technician', 'Camera Operator', 'Stage Manager', 'Production Assistant', 'Director', 'Producer'];

  // Local search state for immediate UI feedback
  const [localSearchValue, setLocalSearchValue] = useState(filters.search || '');

  // Stable updateFilters function
  const updateFilters = useCallback((updates: Partial<ResourceFilters>) => {
    // Convert "all" values to empty strings for internal state
    const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key as keyof ResourceFilters] = value === 'all' ? '' : value;
      return acc;
    }, {} as Partial<ResourceFilters>);
    
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
    filters.search || 
    (filters.equipmentType && filters.equipmentType !== 'all') || 
    (filters.crewRole && filters.crewRole !== 'all')
  );

  const clearAllFilters = () => {
    setLocalSearchValue(''); // Clear local search state too
    onFiltersChange({
      search: '',
      equipmentType: '',
      crewRole: ''
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
                placeholder={`Search ${isCrewTab ? 'crew' : 'equipment'}...`}
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                className="pl-9 w-64 h-8"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1">
              {isCrewTab ? (
                <Select value={filters.crewRole || 'all'} onValueChange={(value) => updateFilters({ crewRole: value })}>
                  <SelectTrigger className="w-auto h-8 text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {crewRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={filters.equipmentType || 'all'} onValueChange={(value) => updateFilters({ equipmentType: value })}>
                  <SelectTrigger className="w-auto h-8 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {equipmentTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* More Filters Button */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2 relative">
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                        !
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Advanced Filters</h4>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-1 text-xs">
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    {/* Advanced filters can be added here */}
                    <div className="text-sm text-muted-foreground">
                      More filter options coming soon...
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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

                {filters.equipmentType && filters.equipmentType !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    {filters.equipmentType}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => updateFilters({ equipmentType: '' })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {filters.crewRole && filters.crewRole !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    {filters.crewRole}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                      onClick={() => updateFilters({ crewRole: '' })}
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
        <div className="flex items-center gap-32">
          <Button size="sm" className="gap-1 h-6 px-1.5 text-xs" onClick={onAddClick}>
            <Plus className="h-3 w-3" />
            Add {isCrewTab ? 'Member' : 'Equipment'}
          </Button>
          
          <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'equipment' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('equipment')}
            className={`flex items-center gap-2 ${
              activeTab === 'equipment' ? 'bg-green-100 text-green-700' : ''
            }`}
          >
            <Package className="h-4 w-4" />
            Equipment
          </Button>
          <Button
            variant={activeTab === 'crew' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('crew')}
            className={`flex items-center gap-2 ${
              activeTab === 'crew' ? 'bg-orange-100 text-orange-700' : ''
            }`}
          >
            <Users className="h-4 w-4" />
            Crew
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}