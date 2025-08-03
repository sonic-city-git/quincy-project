import { format } from "date-fns";
import { Package, Users, Search, Filter, X, AlertTriangle } from "lucide-react";
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
  selectedOwner: string;
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
  showProblemsOnly?: boolean;
  onToggleProblemsOnly?: () => void;
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
  onFiltersChange,
  showProblemsOnly = false,
  onToggleProblemsOnly
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
        
        {/* Show Problems Button and Tab Toggle */}
        <div className="flex items-center gap-32">
          {/* Show Problems Button */}
          {onToggleProblemsOnly && (
            <Button 
              size="xs" 
              className="gap-1 h-6 px-1.5 text-xs"
              onClick={onToggleProblemsOnly}
              style={showProblemsOnly ? {
                backgroundColor: '#ef4444',
                color: '#ffffff',
                borderColor: '#ef4444'
              } : {}}
            >
              <AlertTriangle className="h-3 w-3" />
              Show Problems
            </Button>
          )}
          
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
      </div>
      
      {/* Column Headers */}
      <div className="flex border-b border-border">
        {/* Left Header - Resource Names */}
        <div 
          className="flex-shrink-0 bg-muted/90 backdrop-blur-sm border-r border-border"
          style={{ width: LAYOUT.EQUIPMENT_NAME_WIDTH }}
        >
                      <div className="h-[57px] py-4 px-4 border-b border-border/50 flex flex-col justify-center">
              <div className="text-sm font-semibold text-foreground">{resourceLabel}</div>
              <div className="text-xs text-muted-foreground mt-1">{resourceSubtitle}</div>
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
            <div style={{ height: LAYOUT.MONTH_HEADER_HEIGHT }} className="border-b border-border/50">
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
                      
                      <div className="absolute inset-0 flex justify-between items-center px-4">
                        {/* Left month marker */}
                        <div className="flex flex-col items-center opacity-30">
                          <span className="text-xs font-medium whitespace-nowrap">
                            {format(section.date, 'MMM')}
                          </span>
                        </div>
                        
                        {/* Center main month display */}
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
                        
                        {/* Right month marker */}
                        <div className="flex flex-col items-center opacity-30">
                          <span className="text-xs font-medium whitespace-nowrap">
                            {format(section.date, 'MMM')}
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
              {formattedDates.map((dateInfo, index) => {
                // Check if this is the first day of a new year or month
                const prevDate = index > 0 ? formattedDates[index - 1] : null;
                const isNewYear = prevDate && 
                  dateInfo.date.getFullYear() !== prevDate.date.getFullYear();
                const isNewMonth = prevDate && 
                  (dateInfo.date.getMonth() !== prevDate.date.getMonth() || isNewYear);
                
                // Add month divider
                const showMonthDivider = isNewMonth || index === 0;
                
                return (
                  <div key={dateInfo.date.toISOString()} className="relative" style={{ width: LAYOUT.DAY_CELL_WIDTH }}>
                    {/* Month/Year dividers */}
                    {showMonthDivider && (
                      <div className={`absolute left-0 top-0 bottom-0 w-[1px] ${
                        isNewYear ? 'bg-foreground/30' : 'bg-foreground/10'
                      }`}></div>
                    )}
                    
                    <div
                      className={`h-9 mx-1 flex flex-col items-center justify-center rounded-md text-sm font-medium transition-colors cursor-pointer select-none relative ${
                        dateInfo.isToday
                          ? 'bg-blue-500 text-white shadow-md' 
                          : isNewYear
                          ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                          : dateInfo.isWeekendDay
                          ? 'text-red-600 hover:bg-muted/30'
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
  );
}