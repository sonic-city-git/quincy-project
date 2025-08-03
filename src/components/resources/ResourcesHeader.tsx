import { Search, X, Package, Users, Database, Plus, Mic, Volume2, Lightbulb, Video, Cable, Building, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { useFolders } from "@/hooks/useFolders";
import { FOLDER_ORDER } from "@/types/equipment";

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

  // Dynamic equipment types from database, ordered by FOLDER_ORDER
  const { folders: foldersData, loading: foldersLoading } = useFolders();
  const equipmentTypes = (() => {
    if (!foldersData) return [];
    
    // Get actual folder names from database (main folders only)
    const actualFolderNames = foldersData
      .filter(folder => !folder.parent_id)
      .map(folder => folder.name);
    
    // Filter FOLDER_ORDER to only include folders that exist in database
    return FOLDER_ORDER.filter(folderName => actualFolderNames.includes(folderName));
  })();
  
  // Dynamic crew roles from database
  const { roles: crewRolesData, isLoading: crewRolesLoading } = useCrewRoles();
  const crewRoles = crewRolesData?.map(role => role.name) || [];

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
    filters.search
  );

  const clearAllFilters = () => {
    setLocalSearchValue(''); // Clear local search state too
    onFiltersChange({
      search: '',
      equipmentType: '',
      crewRole: ''
    });
  };

  // Equipment type icons
  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'Mixers': return Package;
      case 'Microphones': return Mic;
      case 'Speakers': return Volume2;
      case 'Lighting': return Lightbulb;
      case 'Video': return Video;
      case 'Cables': return Cable;
      case 'Stage': return Building;
      default: return Settings;
    }
  };

  // Crew role icons - intelligent mapping based on role name
  const getCrewIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('sound') || roleLower.includes('audio')) return Mic;
    if (roleLower.includes('lighting') || roleLower.includes('light')) return Lightbulb;
    if (roleLower.includes('camera') || roleLower.includes('video') || roleLower.includes('director')) return Video;
    if (roleLower.includes('stage') || roleLower.includes('manager')) return Building;
    return Users; // Default for all other roles
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
                className="pl-9 w-56 h-8"
              />
            </div>

            {/* Resource Type Filter */}
            <div className="flex items-center gap-1">
              {isCrewTab ? (
                <>
                  <Select value={filters.crewRole || 'all'} onValueChange={(value) => updateFilters({ crewRole: value })}>
                    <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs bg-muted/50 border-border/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        {filters.crewRole && filters.crewRole !== 'all' ? (
                          <>
                            {(() => {
                              const IconComponent = getCrewIcon(filters.crewRole);
                              return <IconComponent className="h-4 w-4 text-orange-500" />;
                            })()}
                            <span>{filters.crewRole}</span>
                          </>
                        ) : (
                          <span>All Roles</span>
                        )}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="w-[200px]">
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>All Roles</span>
                        </div>
                      </SelectItem>
                      {crewRolesLoading ? (
                        <SelectItem value="loading" disabled>
                          <span className="text-sm text-muted-foreground">Loading roles...</span>
                        </SelectItem>
                      ) : (
                        crewRoles.map(role => {
                          const IconComponent = getCrewIcon(role);
                          return (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-orange-500" />
                                <span>{role}</span>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Clear Crew Role Button */}
                  {filters.crewRole && filters.crewRole !== 'all' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => updateFilters({ crewRole: 'all' })}
                      title="Clear role filter"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Select value={filters.equipmentType || 'all'} onValueChange={(value) => updateFilters({ equipmentType: value })}>
                    <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs bg-muted/50 border-border/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        {filters.equipmentType && filters.equipmentType !== 'all' ? (
                          <>
                            {(() => {
                              const IconComponent = getEquipmentIcon(filters.equipmentType);
                              return <IconComponent className="h-4 w-4 text-green-500" />;
                            })()}
                            <span>{filters.equipmentType}</span>
                          </>
                        ) : (
                          <span>All Types</span>
                        )}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="w-[200px]">
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>All Types</span>
                        </div>
                      </SelectItem>
                      {foldersLoading ? (
                        <SelectItem value="loading" disabled>
                          <span className="text-sm text-muted-foreground">Loading types...</span>
                        </SelectItem>
                      ) : (
                        equipmentTypes.map(type => {
                          const IconComponent = getEquipmentIcon(type);
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-green-500" />
                                <span>{type}</span>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Clear Equipment Type Button */}
                  {filters.equipmentType && filters.equipmentType !== 'all' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => updateFilters({ equipmentType: 'all' })}
                      title="Clear type filter"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </>
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