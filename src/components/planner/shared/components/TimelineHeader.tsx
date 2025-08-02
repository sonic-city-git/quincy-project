import { format } from "date-fns";
import { Package, Users, Search, Filter, X } from "lucide-react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { Badge } from "../../../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../../ui/popover";
import { LAYOUT } from '../constants';
import { FOLDER_ORDER } from '../../../../types/equipment';
import { useState, useEffect, useCallback } from "react";

interface MonthSection {
  monthYear: string;
  date: Date;
  startIndex: number;
  endIndex: number;
  width: number;
  isEven: boolean;
}

// Filter types
export interface PlannerFilters {
  search: string;
  equipmentType: string;
  crewRole: string;
}

interface TimelineHeaderProps {
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  monthSections: MonthSection[];
  onDateChange: (date: Date) => void;
  onHeaderScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  stickyHeadersRef: React.RefObject<HTMLDivElement>;
  resourceType?: 'equipment' | 'crew';
  activeTab?: 'equipment' | 'crew';
  onTabChange?: (tab: 'equipment' | 'crew') => void;
  filters?: PlannerFilters;
  onFiltersChange?: (filters: PlannerFilters) => void;
}

export function TimelineHeader({
  formattedDates,
  monthSections,
  onDateChange,
  onHeaderScroll,
  stickyHeadersRef,
  resourceType = 'equipment',
  activeTab,
  onTabChange,
  filters,
  onFiltersChange
}: TimelineHeaderProps) {
  // Dynamic content based on resource type
  const isCrewPlanner = resourceType === 'crew';
  const title = isCrewPlanner ? 'Crew Planner' : 'Equipment Planner';
  const icon = isCrewPlanner ? Users : Package;
  const IconComponent = icon;
  const iconColor = isCrewPlanner ? 'text-orange-500' : 'text-green-500';
  const resourceLabel = isCrewPlanner ? 'Crew' : 'Equipment';
  const resourceSubtitle = isCrewPlanner ? 'Name / Role' : 'Name / Stock';

  // Predefined filters
  const equipmentTypes = FOLDER_ORDER;
  const crewRoles = ['Sound Engineer', 'Lighting Technician', 'Camera Operator', 'Stage Manager', 'Production Assistant', 'Director', 'Producer'];

  // Local search state for immediate UI feedback
  const [localSearchValue, setLocalSearchValue] = useState(filters?.search || '');

  // Stable updateFilters function
  const updateFilters = useCallback((updates: Partial<PlannerFilters>) => {
    if (filters && onFiltersChange) {
      // Convert "all" values to empty strings for internal state
      const normalizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        acc[key as keyof PlannerFilters] = value === 'all' ? '' : value;
        return acc;
      }, {} as Partial<PlannerFilters>);
      
      onFiltersChange({ ...filters, ...normalizedUpdates });
    }
  }, [filters, onFiltersChange]);

  // Update local search when external filters change
  useEffect(() => {
    setLocalSearchValue(filters?.search || '');
  }, [filters?.search]);

  // Debounced search to prevent lag
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearchValue !== filters?.search) {
        updateFilters({ search: localSearchValue });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchValue, filters?.search, updateFilters]);

  // Filter helpers
  const hasActiveFilters = filters && (
    filters.search || 
    (filters.equipmentType && filters.equipmentType !== 'all') || 
    (filters.crewRole && filters.crewRole !== 'all')
  );

  const clearAllFilters = () => {
    setLocalSearchValue(''); // Clear local search state too
    if (onFiltersChange) {
      onFiltersChange({
        search: '',
        equipmentType: '',
        crewRole: ''
      });
    }
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
          
          {/* Search and Filters - only show if filters are provided */}
          {filters && onFiltersChange && (
            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${isCrewPlanner ? 'crew' : 'equipment'}...`}
                  value={localSearchValue}
                  onChange={(e) => setLocalSearchValue(e.target.value)}
                  className="pl-9 w-64 h-8"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-1">
                {isCrewPlanner ? (
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
          )}
        </div>
        
        {/* Tab Toggle - only show if both activeTab and onTabChange are provided */}
        {activeTab && onTabChange && (
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
        )}
      </div>
      
      {/* Column Headers */}
      <div className="flex border-b border-border">
        {/* Left Header - Resource Names */}
        <div 
          className="flex-shrink-0 bg-muted/90 backdrop-blur-sm border-r border-border"
          style={{ width: LAYOUT.EQUIPMENT_NAME_WIDTH }}
        >
          <div className="h-12 py-3 px-4 border-b border-border/50">
            <div className="text-sm font-semibold text-foreground">{resourceLabel}</div>
          </div>
          <div className="h-12 py-3 px-4">
            <div className="text-xs text-muted-foreground">{resourceSubtitle}</div>
          </div>
        </div>
        
        {/* Middle Header - Timeline */}
        <div 
          ref={stickyHeadersRef}
          className="flex-1 bg-muted/90 backdrop-blur-sm overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={onHeaderScroll}
        >
          <div style={{ width: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px` }}>
            {/* Month Header */}
            <div className="h-12 border-b border-border/50">
              <div className="flex">
                {monthSections.map((section, index) => {
                  // Check if this is a year transition (different year from previous section)
                  const prevSection = index > 0 ? monthSections[index - 1] : null;
                  const isYearTransition = prevSection && 
                    section.date.getFullYear() !== prevSection.date.getFullYear();
                  
                  return (
                    <div 
                      key={`section-${section.monthYear}`}
                      className={`border-r border-border/30 flex items-center justify-center relative ${
                        section.isEven ? 'bg-muted/40' : 'bg-muted/20'
                      }`}
                      style={{ width: `${section.width}px`, minWidth: `${LAYOUT.DAY_CELL_WIDTH}px` }}
                    >
                      {/* Year transition indicator */}
                      {isYearTransition && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l"></div>
                      )}
                      
                      <span className={`text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md shadow-sm border ${
                        isYearTransition 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : 'bg-background/90 text-foreground border-border/20'
                      }`}>
                        {format(section.date, 'MMMM yyyy')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Date Header */}
            <div className="h-12 flex py-3">
              {formattedDates.map((dateInfo, index) => {
                // Check if this is the first day of a new year
                const prevDate = index > 0 ? formattedDates[index - 1] : null;
                const isNewYear = prevDate && 
                  dateInfo.date.getFullYear() !== prevDate.date.getFullYear();
                const isNewMonth = prevDate && 
                  (dateInfo.date.getMonth() !== prevDate.date.getMonth() || isNewYear);
                
                return (
                  <div key={dateInfo.date.toISOString()} className="px-1 relative" style={{ width: LAYOUT.DAY_CELL_WIDTH }}>
                    {/* Year transition indicator for date cells */}
                    {isNewYear && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded"></div>
                    )}
                    
                    <div
                      className={`h-8 flex flex-col items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer select-none relative ${
                        dateInfo.isToday
                          ? 'bg-blue-500 text-white shadow-md' 
                          : isNewYear
                          ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                          : dateInfo.isWeekendDay
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          : 'text-muted-foreground hover:bg-muted/50'
                      } ${
                        dateInfo.isSelected 
                          ? 'ring-2 ring-blue-300' 
                          : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateChange(dateInfo.date);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        // Only handle double-click if this day is already selected
                        if (dateInfo.isSelected) {
                          const today = new Date();
                          onDateChange(today);
                        }
                      }}
                      title={`${format(dateInfo.date, 'EEEE, MMMM d, yyyy')}${dateInfo.isToday ? ' (Today)' : ''}${dateInfo.isSelected ? ' (Selected - Double-click to go to Today)' : ''}`}
                    >
                      <div className="text-[10px] leading-none">{format(dateInfo.date, 'EEE')[0]}</div>
                      <div className="text-xs font-medium leading-none">
                        {format(dateInfo.date, 'd')}
                        {/* Show year on first day of year */}
                        {isNewYear && (
                          <div className="text-[8px] text-blue-600 font-bold leading-none">
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
  );
}