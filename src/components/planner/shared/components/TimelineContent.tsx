import React, { memo, useMemo } from "react";
import { Package } from "lucide-react";
import { Card, CardContent } from "../../../ui/card";
import { ResourceFolderSection } from "./ResourceFolderSection";
import { TimelineSection } from "./TimelineSection";
import { LAYOUT } from '../constants';
import { EquipmentGroup } from '../types';
import { PlannerFilters } from './TimelineHeader';

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
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any; // Optimized function for day cells
  getProjectQuantityForDate: (projectName: string, equipmentId: string, dateStr: string) => any; // New: project quantity function
  getCrewRoleForDate?: (projectName: string, crewMemberId: string, dateStr: string) => any; // New: crew role function
  equipmentRowsRef: React.RefObject<HTMLDivElement>;
  handleTimelineScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  handleTimelineMouseMove: (e: React.MouseEvent) => void;
  scrollHandlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseUp: () => void;
    handleMouseLeave: () => void;
  };
  isDragging: boolean;
  getBookingsForEquipment: (equipmentId: string, dateStr: string, equipment: any) => any; // Legacy function for folder section
  getBookingState: (equipmentId: string, dateStr: string) => any;
  updateBookingState: (equipmentId: string, dateStr: string, state: any) => void;
  getLowestAvailable: (equipmentId: string) => number;
  resourceType?: 'equipment' | 'crew'; // Added prop to indicate resource type
  filters?: PlannerFilters; // Add filters prop
}

const TimelineContentComponent = ({
  equipmentGroups,
  expandedGroups,
  expandedEquipment,
  equipmentProjectUsage,
  toggleGroup,
  toggleEquipmentExpansion,
  formattedDates,
  getBookingForEquipment,
  getProjectQuantityForDate,
  getCrewRoleForDate,
  equipmentRowsRef,
  handleTimelineScroll,
  handleTimelineMouseMove,
  scrollHandlers,
  isDragging,
  getBookingsForEquipment,
  getBookingState,
  updateBookingState,
  getLowestAvailable,
  resourceType = 'equipment',
  filters
}: TimelineContentProps) => {
  
  // Apply UI-level filtering to equipment groups with smart expansion
  const { filteredEquipmentGroups, shouldExpand } = useMemo(() => {
    // Check if filters are actually active
    const hasActiveFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
    if (!hasActiveFilters) return { filteredEquipmentGroups: equipmentGroups, shouldExpand: new Set<string>() };
    
    const { search, equipmentType, crewRole } = filters;
    const isCrewMode = resourceType === 'crew';
    const shouldExpand = new Set<string>();
    
    const filtered = equipmentGroups.map(group => {
      // Filter by equipment type/crew role (folder/department name)
      const typeFilter = isCrewMode ? crewRole : equipmentType;
      if (typeFilter && group.mainFolder !== typeFilter) {
        return null; // Hide entire group
      }
      
      // Filter equipment/crew members by search term
      const filteredEquipment = group.equipment.filter(item => {
        if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        return true;
      });
      
      // Filter subfolders if they exist
      const filteredSubFolders = group.subFolders?.map(subFolder => {
        const filteredSubEquipment = subFolder.equipment.filter(item => {
          if (search && !item.name.toLowerCase().includes(search.toLowerCase())) {
            return false;
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
    
    return { filteredEquipmentGroups: filtered, shouldExpand };
  }, [equipmentGroups, filters, resourceType]);
  
  // Auto-expand folders that contain filtered results (only when filters are active)
  React.useEffect(() => {
    const hasActiveFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
    if (hasActiveFilters && shouldExpand.size > 0) {
      shouldExpand.forEach(groupKey => {
        if (!expandedGroups.has(groupKey)) {
          toggleGroup(groupKey, false);
        }
      });
    }
  }, [shouldExpand, expandedGroups, toggleGroup, filters]);
  if (!filteredEquipmentGroups || filteredEquipmentGroups.length === 0) {
    const hasFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
    const emptyMessage = hasFilters 
      ? `No ${resourceType === 'crew' ? 'crew members' : 'equipment'} match your current filters`
      : `No ${resourceType === 'crew' ? 'crew assignments' : 'equipment bookings'} found for this week`;
    
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
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      <div className="flex">
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
            />
          ))}
        </div>

        {/* Middle Column - Timeline (Horizontally Scrollable) */}
        <div 
          ref={equipmentRowsRef}
          className={`flex-1 overflow-x-auto scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onScroll={handleTimelineScroll}
          onMouseDown={scrollHandlers.handleMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={scrollHandlers.handleMouseUp}
          onMouseLeave={scrollHandlers.handleMouseLeave}
        >
          <div style={{ minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px` }}>
            {filteredEquipmentGroups.map((group) => (
                              <TimelineSection
                  key={`timeline-${group.mainFolder}`}
                  equipmentGroup={group}
                  expandedGroups={expandedGroups}
                  expandedEquipment={expandedEquipment}
                  equipmentProjectUsage={equipmentProjectUsage}
                  formattedDates={formattedDates}
                  getBookingForEquipment={getBookingForEquipment}
                  getProjectQuantityForDate={getProjectQuantityForDate}
                  getCrewRoleForDate={getCrewRoleForDate}
                  onToggleEquipmentExpansion={toggleEquipmentExpansion}
                  onToggleGroupExpansion={toggleGroup}
                  resourceType={resourceType}
                  filters={filters}
                  isUnfilledRolesSection={group.isUnfilledRolesSection}
                />
            ))}
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
    prevProps.toggleGroup !== nextProps.toggleGroup
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