import React, { memo, useMemo } from "react";
import { Package } from "lucide-react";
import { Card, CardContent } from "../../../ui/card";
import { ResourceFolderSection } from "./ResourceFolderSection";
import { TimelineSection } from "./TimelineSection";
import { LAYOUT } from '../constants';
import { EquipmentGroup } from '../types';
import { PlannerFilters } from './TimelineHeader';
import { analyzeFolderWarnings } from '../utils/folderWarnings';
import { analyzeCrewWarnings } from '../utils/crewWarnings';



interface TimelineContentProps {
  equipmentGroups: EquipmentGroup[];
  expandedGroups: Set<string>;
  expandedEquipment: Set<string>; // New: equipment-level expansion
  equipmentProjectUsage: Map<string, any>; // New: project usage data
  toggleGroup: (groupName: string, expandAllSubfolders?: boolean) => void;
  toggleEquipmentExpansion: (equipmentId: string) => void; // New: equipment expansion toggle
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  virtualTimeline?: {
    virtualDates: Array<{
      date: Date;
      dateStr: string;
      isToday: boolean;
      isSelected: boolean;
      isWeekendDay: boolean;
    }>;
    totalWidth: number;
    offsetLeft: number;
    isVirtualized: boolean;
  };
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any; // Optimized function for day cells
  getProjectQuantityForDate: (projectName: string, equipmentId: string, dateStr: string) => any; // New: project quantity function
  getCrewRoleForDate?: (projectName: string, crewMemberId: string, dateStr: string) => any; // New: crew role function
  equipmentRowsRef: React.RefObject<HTMLDivElement>;
  setEquipmentRowsRef?: (element: HTMLDivElement | null) => void;
  handleTimelineScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  handleTimelineMouseMove: (e: React.MouseEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleMouseLeave: () => void;
  isDragging: boolean;
  getBookingsForEquipment: (equipmentId: string, dateStr: string, equipment: any) => any; // Legacy function for folder section
  getBookingState: (equipmentId: string, dateStr: string) => any;
  updateBookingState: (equipmentId: string, dateStr: string, state: any) => void;
  getLowestAvailable: (equipmentId: string) => number;
  resourceType?: 'equipment' | 'crew'; // Added prop to indicate resource type
  filters?: PlannerFilters; // Add filters prop
  showProblemsOnly?: boolean; // Add problems-only filter prop
  warnings?: any[]; // PERFORMANCE: Pre-calculated warnings for optimized problems view
  visibleTimelineStart?: Date; // Visible timeline start for performance
  visibleTimelineEnd?: Date; // Visible timeline end for performance
  isWithinScrollContainer?: boolean; // Flag to remove own scroll area when within unified container
  suggestionsByDate?: Map<string, any[]>; // Subrental suggestions by date
  onSubrentalClick?: (suggestion: any, date: string) => void; // Subrental suggestion handler
}

const TimelineContentComponent = ({
  equipmentGroups,
  expandedGroups,
  expandedEquipment,
  equipmentProjectUsage,
  toggleGroup,
  toggleEquipmentExpansion,
  formattedDates,
  virtualTimeline,
  getBookingForEquipment,
  getProjectQuantityForDate,
  getCrewRoleForDate,
  equipmentRowsRef,
  setEquipmentRowsRef,
  handleTimelineScroll,
  handleTimelineMouseMove,
  handleMouseDown,
  handleMouseUp,
  handleMouseLeave,
  isDragging,
  getBookingsForEquipment,
  getBookingState,
  updateBookingState,
  getLowestAvailable,
  resourceType = 'equipment',
  filters,
  showProblemsOnly = false,
  warnings, // PERFORMANCE: Pre-calculated warnings
  visibleTimelineStart,
  visibleTimelineEnd,
  isWithinScrollContainer = false,
  suggestionsByDate,
  onSubrentalClick
}: TimelineContentProps) => {
  
  // Combined ref callback to handle both ref object and callback
  const combinedRef = (element: HTMLDivElement | null) => {
    // Set the ref object
    if (equipmentRowsRef.current !== element) {
      equipmentRowsRef.current = element;
    }
    // Call the callback ref for container detection
    if (setEquipmentRowsRef) {
      setEquipmentRowsRef(element);
    }
  };
  
  // Memoize visible dates calculation for performance
  const visibleDates = useMemo(() => {
    if (!formattedDates || !visibleTimelineStart || !visibleTimelineEnd) {
      return [];
    }
    return formattedDates.filter(dateInfo => {
      const date = new Date(dateInfo.dateStr);
      return date >= visibleTimelineStart && date <= visibleTimelineEnd;
    });
  }, [formattedDates, visibleTimelineStart, visibleTimelineEnd]);

  // PERFORMANCE OPTIMIZATION: Pre-calculate problems lookup at top level
  const problemsLookup = useMemo(() => {
    if (!warnings?.length) return new Set();
    return new Set(warnings.map(w => w.resourceId));
  }, [warnings]);

  // Apply UI-level filtering to equipment groups with smart expansion
  const { filteredEquipmentGroups, shouldExpand, showNoProblemsMessage } = useMemo(() => {
    // Check if any filters are actually active
    const hasTextFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
    const hasProblemsFilter = showProblemsOnly;
    const hasAnyFilters = hasTextFilters || hasProblemsFilter;
    
    // If no filters are active, return all equipment groups
    if (!hasAnyFilters) {
      return { filteredEquipmentGroups: equipmentGroups, shouldExpand: new Set<string>(), showNoProblemsMessage: false };
    }
    
    const { search, equipmentType, crewRole } = filters || {};
    const isCrewMode = resourceType === 'crew';
    const shouldExpand = new Set<string>();

    const hasProblems = (item: any) => {
      if (!hasProblemsFilter) {
        return true; // If not filtering by problems, include all
      }
      
      // For unfilled roles: they are always a "problem" since they need to be filled
      if (item?.availability === 'needed') return true;
      
      // OPTIMIZED: Use pre-calculated warnings lookup instead of scanning all dates
      return problemsLookup.has(item.id);
    };
    
    const filtered = equipmentGroups.map(group => {
      // Different filtering logic for crew vs equipment
      const typeFilter = isCrewMode ? crewRole : equipmentType;
      
      // For equipment mode: filter by equipment type (folder/department name)
      if (!isCrewMode && typeFilter && group.mainFolder !== typeFilter) {
        return null; // Hide entire group
      }
      
      // Filter equipment/crew members by search term, problems, and role (for crew)
      const filteredEquipment = group.equipment.filter(item => {
        // Search filter
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        
        // Problems filter
        if (!hasProblems(item)) {
          return false;
        }
        
        // Crew role filter - check individual crew member roles
        if (isCrewMode && crewRole) {
          // For regular crew members, check if they have the selected role
          if ((item as any).roles && Array.isArray((item as any).roles)) {
            if (!(item as any).roles.includes(crewRole)) {
              return false;
            }
          }
          // For unfilled roles, check the role property
          else if ((item as any).role && (item as any).role !== crewRole) {
            return false;
          }
        }
        
        return true;
      });
      
      // Filter subfolders if they exist
      const filteredSubFolders = group.subFolders?.map(subFolder => {
        // For unfilled roles group, filter subfolders by role name
        if (isCrewMode && crewRole && group.mainFolder === 'Unfilled Roles') {
          if (subFolder.name !== crewRole) {
            return null; // Hide subfolder if it doesn't match the selected role
          }
        }
        
        const filteredSubEquipment = subFolder.equipment.filter(item => {
          // Search filter
          if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
            return false;
          }
          
          // Problems filter
          if (!hasProblems(item)) {
            return false;
          }
          
          // Crew role filter
          if (isCrewMode && crewRole) {
            // For regular crew members, check if they have the selected role
            if ((item as any).roles && Array.isArray((item as any).roles)) {
              if (!(item as any).roles.includes(crewRole)) {
                return false;
              }
            }
            // For unfilled roles, check the role property
            else if ((item as any).role && (item as any).role !== crewRole) {
              return false;
            }
          }
          
          return true;
        });
        
        // Only return subfolder if it has matching equipment
        if (filteredSubEquipment.length > 0) {
          // Mark this subfolder for expansion since it has results
          shouldExpand.add(`${group.mainFolder}/${subFolder.name}`);
          return {
            ...subFolder,
            equipment: filteredSubEquipment,
            isExpanded: true // Force expansion for filtered results
          };
        }
        return null;
      }).filter(Boolean) || [];
      
      // Only return group if it has matching equipment or subfolders
      if (filteredEquipment.length > 0 || filteredSubFolders.length > 0) {
        // Mark this main folder for expansion since it has results
        shouldExpand.add(group.mainFolder);
        
        return {
          ...group,
          equipment: filteredEquipment,
          subFolders: filteredSubFolders,
          isExpanded: true // Force expansion for filtered results
        };
      }
      
      return null;
    }).filter(Boolean) as EquipmentGroup[];
    
    // CRITICAL FIX: When in problems mode but no problems found, show all groups
    // This preserves timeline functionality and date selection
    if (hasProblemsFilter && !hasTextFilters && filtered.length === 0) {
      console.log(`🔄 [${resourceType?.toUpperCase()}] NO PROBLEMS FOUND - falling back to all groups to preserve timeline`);
      return { 
        filteredEquipmentGroups: equipmentGroups, 
        shouldExpand: new Set<string>(),
        showNoProblemsMessage: true // Flag to show success message
      };
    }
    
    return { filteredEquipmentGroups: filtered, shouldExpand, showNoProblemsMessage: false };
  }, [
    equipmentGroups, 
    filters?.search, 
    filters?.equipmentType, 
    filters?.crewRole, 
    resourceType, 
    showProblemsOnly,
    problemsLookup // PERFORMANCE: Use pre-calculated problems lookup
  ]);
  
  // Auto-expand folders that contain filtered results (only when filters are active)
  React.useEffect(() => {
    const hasTextFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
    const hasProblemsFilter = showProblemsOnly;
    const hasAnyFilters = hasTextFilters || hasProblemsFilter;
    
    // DEBUG: Track expansion behavior when problems mode is active
    if (hasProblemsFilter) {
      console.log(`🔍 [${resourceType?.toUpperCase() || 'UNKNOWN'}] AUTO-EXPANSION CHECK:`, {
        showProblemsOnly: showProblemsOnly,
        shouldExpandSize: shouldExpand.size,
        expandedGroupsSize: expandedGroups.size,
        hasTextFilters: hasTextFilters,
        willExpand: hasAnyFilters && shouldExpand.size > 0
      });
    }
    
    if (hasAnyFilters && shouldExpand.size > 0) {
      shouldExpand.forEach(groupKey => {
        if (!expandedGroups.has(groupKey)) {
          console.log(`📂 [${resourceType?.toUpperCase() || 'UNKNOWN'}] Auto-expanding group:`, groupKey);
          toggleGroup(groupKey, false);
        }
      });
    } else if (hasProblemsFilter && shouldExpand.size === 0) {
      console.log(`⚠️ [${resourceType?.toUpperCase() || 'UNKNOWN'}] NO PROBLEMS FOUND - no auto-expansion needed`);
    }
  }, [shouldExpand?.size || 0, expandedGroups?.size || 0, showProblemsOnly, filters?.search, filters?.equipmentType, filters?.crewRole, toggleGroup, resourceType]);
  
  if (!filteredEquipmentGroups || filteredEquipmentGroups.length === 0) {
    const hasTextFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
    const hasProblemsFilter = showProblemsOnly;
    const hasAnyFilters = hasTextFilters || hasProblemsFilter;
    
    let emptyMessage = `No ${resourceType === 'crew' ? 'crew assignments' : 'equipment bookings'} found for this week`;
    
    if (hasProblemsFilter && !hasTextFilters) {
      emptyMessage = `No ${resourceType === 'crew' ? 'crew problems' : 'equipment problems'} found! 🎉`;
      

    } else if (hasTextFilters && hasProblemsFilter) {
      emptyMessage = `No ${resourceType === 'crew' ? 'crew members' : 'equipment'} with problems match your current filters`;
    } else if (hasTextFilters) {
      emptyMessage = `No ${resourceType === 'crew' ? 'crew members' : 'equipment'} match your current filters`;
    }
    
    return (
      <Card>
        <CardContent className="p-0">
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {emptyMessage}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Success Banner for "No Problems Found" */}
      {showNoProblemsMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 mx-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">
              🎉 No {resourceType === 'crew' ? 'crew problems' : 'equipment problems'} found!
            </span>
            <span className="text-green-600 text-sm">Timeline shows all items for reference.</span>
          </div>
        </div>
      )}
      
      <div className="flex min-h-0">
        {/* Left Column - Equipment Names (Fixed during horizontal scroll) */}
        <div className="flex-shrink-0 border-r border-border" style={{ width: LAYOUT.EQUIPMENT_NAME_WIDTH }}>
          {filteredEquipmentGroups.map((group) => (
            <ResourceFolderSection
              key={group.mainFolder}
              equipmentGroup={group}
              expandedGroups={expandedGroups}
              expandedEquipment={expandedEquipment}
              equipmentProjectUsage={equipmentProjectUsage}
              toggleGroup={toggleGroup}
              formattedDates={formattedDates}
              getBookingsForEquipment={getBookingsForEquipment}
              filters={filters}
              resourceType={resourceType}
              isUnfilledRolesSection={(group as any).isUnfilledRolesSection} // FIXED: Pass the flag
            />
          ))}
        </div>

        {/* Middle Column - Timeline (only horizontal scroll, vertical handled by parent) */}
        <div 
          ref={combinedRef}
          data-timeline-container="true"
          className={`flex-1 overflow-x-auto scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={handleTimelineScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* VIRTUAL TIMELINE: Use virtual width when available for performance */}
          <div style={{ 
            width: virtualTimeline?.totalWidth || `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px`,
            position: 'relative'
          }}>
            <div style={{
              position: virtualTimeline?.isVirtualized ? 'absolute' : 'static',
              left: virtualTimeline?.offsetLeft || 0,
              minWidth: virtualTimeline?.isVirtualized 
                ? `${(virtualTimeline?.virtualDates || formattedDates).length * LAYOUT.DAY_CELL_WIDTH}px`
                : '100%'
            }}>
            {filteredEquipmentGroups.map((group) => (
                              <TimelineSection
                  key={`timeline-${group.mainFolder}`}
                  equipmentGroup={group}
                  expandedGroups={expandedGroups}
                  expandedEquipment={expandedEquipment}
                  equipmentProjectUsage={equipmentProjectUsage}
                  formattedDates={virtualTimeline?.virtualDates || formattedDates}
                  getBookingForEquipment={getBookingForEquipment}
                  getProjectQuantityForDate={getProjectQuantityForDate}
                  getCrewRoleForDate={getCrewRoleForDate}
                  onToggleEquipmentExpansion={toggleEquipmentExpansion}
                  onToggleGroupExpansion={toggleGroup}
                  resourceType={resourceType}
                  filters={filters}
                  isUnfilledRolesSection={(group as any).isUnfilledRolesSection}
                  isSubrentalSection={(group as any).isSubrentalSection}
                  suggestionsByDate={suggestionsByDate}
                  onSubrentalClick={onSubrentalClick}
                />
            ))}
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

// Smart memoization for content component with expansion handling
export const TimelineContent = memo(TimelineContentComponent, (prevProps, nextProps) => {
  // Basic props that must match
  if (
    prevProps.equipmentGroups.length !== nextProps.equipmentGroups.length ||
    prevProps.expandedGroups !== nextProps.expandedGroups ||
    prevProps.expandedEquipment !== nextProps.expandedEquipment ||
    prevProps.isDragging !== nextProps.isDragging ||
    prevProps.filters !== nextProps.filters ||
    prevProps.toggleGroup !== nextProps.toggleGroup ||
    prevProps.showProblemsOnly !== nextProps.showProblemsOnly ||
    prevProps.resourceType !== nextProps.resourceType
  ) {
    return false;
  }
  
  // Function references that should be stable
  if (prevProps.toggleEquipmentExpansion !== nextProps.toggleEquipmentExpansion ||
      prevProps.getProjectQuantityForDate !== nextProps.getProjectQuantityForDate ||
      prevProps.getCrewRoleForDate !== nextProps.getCrewRoleForDate) {
    return false;
  }
  
  // CRITICAL: Check if booking function changed - this ensures timeline sections get updated data
  if (prevProps.getBookingForEquipment !== nextProps.getBookingForEquipment) {
    return false; // Force re-render when booking function changes
  }
  
  // Smart date comparison for timeline expansion
  const prevDates = prevProps.formattedDates;
  const nextDates = nextProps.formattedDates;
  
  // If lengths are equal, check if content is the same AND selected date hasn't changed
  if (prevDates.length === nextDates.length) {
    const firstLastSame = (
      prevDates[0]?.dateStr === nextDates[0]?.dateStr &&
      prevDates[prevDates.length - 1]?.dateStr === nextDates[nextDates.length - 1]?.dateStr
    );
    
    // Also check if selected date has changed within the range
    const prevSelectedIndex = prevDates.findIndex(d => d.isSelected);
    const nextSelectedIndex = nextDates.findIndex(d => d.isSelected);
    const selectedChanged = prevSelectedIndex !== nextSelectedIndex;
    
    return firstLastSame && !selectedChanged;
  }
  
  // Timeline expansion detected - force re-render to show new dates
  if (nextDates.length > prevDates.length) {
    return false; // Force re-render when timeline expands
  }
  
  // Array got smaller or completely different - need re-render
  return false;
});