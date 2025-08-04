import { Search, Package, Users, Mic, Volume2, Lightbulb, Video, Cable, Building, Settings, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { useFolders } from "@/hooks/useFolders";
import { FOLDER_ORDER } from "@/types/equipment";
import { format } from "date-fns";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { Tab } from "@/components/shared/SectionHeader";
import { LAYOUT } from '../constants'; // ✅ Use global LAYOUT constants

// Date interface
interface FormattedDate {
  date: Date;
  isToday: boolean;
  isWeekendDay: boolean;
  isSelected: boolean;
}

// Month section interface
interface MonthSection {
  date: Date;
  monthYear: string;
  width: number;
  startIndex: number;
  endIndex: number;
  isEven: boolean;
}

// Filter interfaces - reexport for backward compatibility
export interface PlannerFilters {
  search: string;
  selectedOwner: string;
  equipmentType: string;
  crewRole: string;
}

interface TimelineHeaderProps {
  formattedDates: FormattedDate[];
  virtualTimeline?: {
    virtualDates: FormattedDate[];
    totalWidth: number;
    offsetLeft: number;
    isVirtualized: boolean;
  };
  monthSections: MonthSection[];
  onDateChange: (date: Date) => void;
  timelineScroll: {
    handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
    scrollPosition: number;
    isDragging: boolean;
  };
  stickyHeadersRef: React.RefObject<HTMLDivElement>;
  resourceType?: 'equipment' | 'crew';
  activeTab?: 'equipment' | 'crew';
  onTabChange?: (tab: 'equipment' | 'crew') => void;
  
  // Filter props (optional)
  filters?: PlannerFilters;
  onFiltersChange?: (filters: PlannerFilters) => void;
  
  // NEW: Flag to indicate if header is within a unified scroll container
  isWithinScrollContainer?: boolean;

  showProblemsOnly?: boolean;
  onToggleProblemsOnly?: () => void;
  
  // NEW: Render mode flags
  renderOnlyLeft?: boolean;
  renderOnlyTimeline?: boolean;
}

export function TimelineHeader({
  formattedDates,
  virtualTimeline,
  monthSections,
  onDateChange,
  timelineScroll,
  stickyHeadersRef,
  resourceType = 'equipment',
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  showProblemsOnly = false,
  onToggleProblemsOnly,
  isWithinScrollContainer = false,
  renderOnlyLeft = false,
  renderOnlyTimeline = false
}: TimelineHeaderProps) {
  
  // Dynamic content based on resource type
  const isCrewPlanner = resourceType === 'crew';
  const title = isCrewPlanner ? 'Crew Planner' : 'Equipment Planner';
  const icon = isCrewPlanner ? Users : Package;
  const IconComponent = icon;
  const iconColor = isCrewPlanner ? 'text-orange-500' : 'text-green-500';
  const resourceLabel = isCrewPlanner ? 'Crew' : 'Equipment';
  const resourceSubtitle = isCrewPlanner ? 'Name / Role' : 'Name / Stock';

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

  // Tab configuration (only if tab switching is enabled)
  const tabs: Tab<'equipment' | 'crew'>[] | undefined = activeTab && onTabChange ? [
    { value: 'equipment', label: 'Equipment', icon: Package, color: 'text-green-500' },
    { value: 'crew', label: 'Crew', icon: Users, color: 'text-orange-500' }
  ] : undefined;

  // Update filters helper
  const updateFilters = useCallback((updates: Partial<PlannerFilters>) => {
    if (!filters || !onFiltersChange) return;
    
      // Convert "all" values to empty strings for internal state
      const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        acc[key as keyof PlannerFilters] = value === 'all' ? '' : value;
        return acc;
      }, {} as Partial<PlannerFilters>);
      
      onFiltersChange({ ...filters, ...normalizedUpdates });
  }, [filters, onFiltersChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    if (!onFiltersChange) return;
    onFiltersChange({
      search: '',
      selectedOwner: '',
      equipmentType: '',
      crewRole: ''
    });
  }, [onFiltersChange]);

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
    if (roleLower.includes('producer')) return Users;
    return Users;
  };

  // Additional timeline content
  const timelineContent = (
    <div style={{ height: `${LAYOUT.MONTH_HEADER_HEIGHT + LAYOUT.DATE_HEADER_HEIGHT}px` }}>
      {/* Column Headers - Fixed height container */}
      <div className="flex border-b border-border" style={{ height: `${LAYOUT.MONTH_HEADER_HEIGHT + LAYOUT.DATE_HEADER_HEIGHT}px` }}>
        {/* Left Header - Resource Names */}
        <div 
          className="flex-shrink-0 bg-muted/90 backdrop-blur-sm border-r border-border"
          style={{ 
            width: LAYOUT.EQUIPMENT_NAME_WIDTH,
            height: `${LAYOUT.MONTH_HEADER_HEIGHT + LAYOUT.DATE_HEADER_HEIGHT}px` // Match timeline header height (100px total)
          }}
        >
          <div className="h-full py-4 px-4 flex flex-col justify-center">
            <div className="text-sm font-semibold text-foreground">{resourceLabel}</div>
            <div className="text-xs text-muted-foreground mt-1">{resourceSubtitle}</div>
          </div>
        </div>
        
        {/* Middle Header - Timeline (fixed header, horizontally scrollable) */}
        <div 
          ref={stickyHeadersRef}
          className="flex-1 bg-muted/90 backdrop-blur-sm overflow-x-auto overflow-y-hidden scrollbar-hide"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            height: `${LAYOUT.MONTH_HEADER_HEIGHT + LAYOUT.DATE_HEADER_HEIGHT}px` // 100px (50px + 50px)
          }}
          onScroll={timelineScroll.handleScroll}
        >
          <div style={{ 
            width: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px`, 
            height: '100%' // Fill container exactly
          }}>
            {/* Month Header */}
            <div style={{ height: LAYOUT.MONTH_HEADER_HEIGHT }}>
              <div className="flex h-full">
                {monthSections.map((section, index) => {
                  // Check if this is a year transition (different year from previous section)
                  const prevSection = index > 0 ? monthSections[index - 1] : null;
                  const isYearTransition = prevSection && 
                    section.date.getFullYear() !== prevSection.date.getFullYear();
                  
                  return (
                    <div 
                      key={`section-${section.monthYear}`}
                      className={`flex items-center justify-center relative ${
                        section.isEven ? 'bg-muted/40' : 'bg-muted/20'
                      }`}
                      style={{ width: `${section.width}px`, minWidth: `${LAYOUT.DAY_CELL_WIDTH}px` }}
                    >
                      {/* Weekend pattern indicator */}
                      <div className="absolute inset-0 flex">
                        {formattedDates
                          .slice(section.startIndex, section.endIndex + 1)
                          .map((date, i) => (
                            <div
                              key={i}
                              className={`${date.isWeekendDay ? 'bg-red-500/5' : ''}`}
                              style={{ width: LAYOUT.DAY_CELL_WIDTH }}
                            />
                          ))}
                      </div>
                      {/* Month divider */}
                      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-foreground/10"></div>
                      {/* Year transition indicator */}
                      {isYearTransition && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-foreground/30 rounded-l"></div>
                      )}
                      
                      <div className="absolute inset-0 flex justify-center items-center">
                        {/* Main month display */}
                        <div className={`flex flex-col items-center ${
                          isYearTransition 
                            ? 'text-foreground' 
                            : 'text-foreground'
                        }`}>
                          <span className="text-sm font-semibold whitespace-nowrap mb-1">
                            {format(section.date, 'MMMM')}
                          </span>
                          <span className={`text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded ${
                            isYearTransition 
                              ? 'bg-muted border border-border' 
                              : 'text-muted-foreground'
                          }`}>
                            {format(section.date, 'yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Date Header */}
            <div style={{ height: LAYOUT.DATE_HEADER_HEIGHT }} className="flex items-center relative">
              {/* VIRTUAL TIMELINE: Use virtual dates when available for performance */}
              <div 
                style={{ 
                  width: virtualTimeline?.totalWidth || `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px`,
                  position: 'relative'
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    left: virtualTimeline?.offsetLeft || 0,
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%' // Ensure full height for proper centering
                  }}
                >
                  {(virtualTimeline?.virtualDates || formattedDates).map((dateInfo, index) => {
                // Check if this is the first day of a new year or month
                const prevDate = index > 0 ? formattedDates[index - 1] : null;
                const isNewYear = prevDate && 
                  dateInfo.date.getFullYear() !== prevDate.date.getFullYear();
                const isNewMonth = prevDate && 
                  (dateInfo.date.getMonth() !== prevDate.date.getMonth() || isNewYear);
                
                // Add month divider
                const showMonthDivider = isNewMonth || index === 0;
                
                return (
                  <div key={dateInfo.date.toISOString()} className="relative flex items-center" style={{ width: LAYOUT.DAY_CELL_WIDTH, height: LAYOUT.DATE_HEADER_HEIGHT }}>
                    {/* Month/Year dividers */}
                    {showMonthDivider && (
                      <div className={`absolute left-0 top-0 bottom-0 w-[1px] ${
                        isNewYear ? 'bg-foreground/30' : 'bg-foreground/10'
                      }`}></div>
                    )}
                    
                    <div
                      className={`w-full px-1 flex flex-col items-center justify-center text-sm font-medium transition-colors cursor-pointer select-none relative ${
                        dateInfo.isToday
                          ? 'bg-blue-500 text-white shadow-md rounded-md' 
                          : dateInfo.isSelected
                          ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300 rounded-md'
                          : isNewYear
                          ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 rounded-md'
                          : dateInfo.isWeekendDay
                          ? 'text-red-600 hover:bg-muted/30 rounded-sm'
                          : 'text-muted-foreground hover:bg-muted/50 rounded-sm'
                      }`}
                      style={{ height: LAYOUT.DATE_CONTENT_HEIGHT }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add a small delay to wait for potential double click
                        const clickTimer = setTimeout(() => {
                          onDateChange(dateInfo.date);
                        }, 200); // 200ms delay to wait for double click

                        // Store the timer in the element's dataset
                        const element = e.currentTarget;
                        // Clear any existing timer
                        const existingTimer = element.dataset.clickTimer;
                        if (existingTimer) {
                          clearTimeout(Number(existingTimer));
                        }
                        element.dataset.clickTimer = String(clickTimer);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        // Clear any pending single click timer
                        const element = e.currentTarget;
                        const existingTimer = element.dataset.clickTimer;
                        if (existingTimer) {
                          clearTimeout(Number(existingTimer));
                          delete element.dataset.clickTimer;
                        }
                        
                        // Double-click anywhere in date header goes to today
                        const today = new Date();
                        today.setHours(0, 0, 0, 0); // Normalize to start of day
                        onDateChange(today);
                      }}
                      title={`${format(dateInfo.date, 'EEEE, MMMM d, yyyy')}${dateInfo.isToday ? ' (Today)' : ''} - Double-click any date to go to Today`}
                    >
                      <div className="text-xs leading-none mb-0.5">{format(dateInfo.date, 'EEE')[0]}</div>
                      <div className="text-sm font-semibold leading-none">
                        {format(dateInfo.date, 'd')}
                        {/* Show year on first day of year */}
                        {isNewYear && (
                          <div className="text-[8px] text-blue-600 font-bold leading-none mt-0.5">
                            {format(dateInfo.date, 'yy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Conditional rendering based on renderOnlyTimeline flag
  if (renderOnlyTimeline) {
    // Only render the timeline content (month/date headers)
    return timelineContent;
  }

  // Standard component render
  return (
    <SectionHeader
      header={{
        title,
        icon: IconComponent,
        iconColor
      }}
      tabs={tabs ? {
        activeTab: activeTab!,
        onTabChange: onTabChange!,
        options: tabs
      } : undefined}
      search={filters && onFiltersChange ? {
        placeholder: `Search ${isCrewPlanner ? 'crew' : 'equipment'}...`,
        value: filters.search,
        onChange: (value) => updateFilters({ search: value })
      } : undefined}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={clearAllFilters}
      actions={
        onToggleProblemsOnly && (
          <Button
            onClick={onToggleProblemsOnly}
            variant={showProblemsOnly ? "default" : "outline"}
            size="sm"
            className="h-7 sm:h-8 px-1.5 sm:px-2 md:px-3 text-xs whitespace-nowrap"
            title={showProblemsOnly ? "Show All" : "View Problems"}
          >
            {showProblemsOnly ? (
              <>
                <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="hidden md:inline ml-1 sm:ml-1.5">Show All</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="hidden md:inline ml-1 sm:ml-1.5">View Problems</span>
              </>
            )}
          </Button>
        )
      }
      additionalContent={timelineContent}
    >
      {/* Resource Type Filter - Only show if filters are provided */}
      {filters && onFiltersChange && (
        <div className="flex items-center gap-1">
          {isCrewPlanner ? (
            // Crew Role Filter
            <Select value={filters.crewRole || 'all'} onValueChange={(value) => updateFilters({ crewRole: value })}>
              <SelectTrigger 
                className={`w-auto min-w-[140px] h-8 text-xs bg-muted/50 border-border/50 hover:bg-muted transition-colors ${
                  filters.crewRole && filters.crewRole !== 'all' ? 'ring-2 ring-orange-500/50 border-orange-500/50 bg-orange-50/50' : ''
                }`}
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
                className={`w-auto min-w-[140px] h-8 text-xs bg-muted/50 border-border/50 hover:bg-muted transition-colors ${
                  filters.equipmentType && filters.equipmentType !== 'all' ? 'ring-2 ring-green-500/50 border-green-500/50 bg-green-50/50' : ''
                }`}
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
      )}
    </SectionHeader>
  );
}