import { Package, Users, Mic, Volume2, Lightbulb, Video, Cable, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { useFolders } from "@/hooks/useFolders";
import { FOLDER_ORDER } from "@/types/equipment";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { COMPONENT_CLASSES, cn, CSS_VARS } from "@/design-system";
import type { Tab } from "@/components/shared/SectionHeader";

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
  // Use design system colors: warning (orange) for crew, success (green) for equipment
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

  // Tab configuration - using design system colors
  const tabs: Tab<'equipment' | 'crew'>[] = [
    { value: 'equipment', label: 'Equipment', icon: Package, color: 'text-green-500' },
    { value: 'crew', label: 'Crew', icon: Users, color: 'text-orange-500' }
  ];

  // Update filters helper
  const updateFilters = (updates: Partial<ResourceFilters>) => {
    // Convert "all" values to empty strings for internal state
    const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      acc[key as keyof ResourceFilters] = value === 'all' ? '' : value;
      return acc;
    }, {} as Partial<ResourceFilters>);
    
    onFiltersChange({ ...filters, ...normalizedUpdates });
  };

  // Clear all filters
  const clearAllFilters = () => {
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
    return Users;
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
        placeholder: window.innerWidth < 640 
          ? "Search..." 
          : `Search ${isCrewTab ? 'crew' : 'equipment'}...`,
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
            title={`Add ${isCrewTab ? 'Member' : 'Equipment'}`}
          >
            <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
            <span className="hidden md:inline ml-1 sm:ml-1.5">Add {isCrewTab ? 'Member' : 'Equipment'}</span>
          </Button>
        )
      }
    >
      {/* Resource Type Filter - Equipment or Crew based on active tab */}
      <div className="flex items-center gap-1">
        {isCrewTab ? (
          // Crew Role Filter
          <Select value={filters.crewRole || 'all'} onValueChange={(value) => updateFilters({ crewRole: value })}>
            <SelectTrigger 
              className={cn(
                "w-auto min-w-[140px] h-8 text-xs",
                COMPONENT_CLASSES.input.filter,
                filters.crewRole && filters.crewRole !== 'all' && "ring-2 ring-primary/50 border-primary/50"
              )}
            >
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
        ) : (
          // Equipment Type Filter
          <Select value={filters.equipmentType || 'all'} onValueChange={(value) => updateFilters({ equipmentType: value })}>
            <SelectTrigger 
              className={cn(
                "w-auto min-w-[140px] h-8 text-xs",
                COMPONENT_CLASSES.input.filter,
                filters.equipmentType && filters.equipmentType !== 'all' && "ring-2 ring-primary/50 border-primary/50"
              )}
            >
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
        )}
      </div>
    </SectionHeader>
  );
}