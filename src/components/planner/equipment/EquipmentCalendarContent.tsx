import { memo } from "react";
import { Package } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { EquipmentFolderSection } from "./EquipmentFolderSection";
import { EquipmentTimelineSection } from "./EquipmentTimelineSection";
import { LAYOUT } from '../constants';
import { EquipmentGroup } from '../types';

interface EquipmentCalendarContentProps {
  equipmentGroups: EquipmentGroup[];
  expandedGroups: Set<string>;
  toggleGroup: (groupName: string, expandAllSubfolders?: boolean) => void;
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any; // Optimized function for day cells
  onDateChange: (date: Date) => void;
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
}

const EquipmentCalendarContentComponent = ({
  equipmentGroups,
  expandedGroups,
  toggleGroup,
  formattedDates,
  getBookingForEquipment,
  onDateChange,
  equipmentRowsRef,
  handleTimelineScroll,
  handleTimelineMouseMove,
  scrollHandlers,
  isDragging,
  getBookingsForEquipment,
  getBookingState,
  updateBookingState,
  getLowestAvailable
}: EquipmentCalendarContentProps) => {
  if (!equipmentGroups || equipmentGroups.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No equipment bookings found for this week
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
          {equipmentGroups.map((group) => (
            <EquipmentFolderSection
              key={group.mainFolder}
              equipmentGroup={group}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              formattedDates={formattedDates}
              getBookingsForEquipment={getBookingsForEquipment}
              getBookingState={getBookingState}
              updateBookingState={updateBookingState}
              onDateChange={onDateChange}
              getLowestAvailable={getLowestAvailable}
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
            {equipmentGroups.map((group) => (
              <EquipmentTimelineSection
                key={`timeline-${group.mainFolder}`}
                equipmentGroup={group}
                expandedGroups={expandedGroups}
                formattedDates={formattedDates}
                getBookingForEquipment={getBookingForEquipment}
                onDateChange={onDateChange}
              />
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

// Smart memoization for content component with expansion handling
export const EquipmentCalendarContent = memo(EquipmentCalendarContentComponent, (prevProps, nextProps) => {
  // Basic props that must match
  if (
    prevProps.equipmentGroups.length !== nextProps.equipmentGroups.length ||
    prevProps.expandedGroups !== nextProps.expandedGroups ||
    prevProps.isDragging !== nextProps.isDragging
  ) {
    return false;
  }
  
  // CRITICAL: Check if booking function changed - this ensures timeline sections get updated data
  if (prevProps.getBookingForEquipment !== nextProps.getBookingForEquipment) {
    return false; // Force re-render when booking function changes
  }
  
  // Smart date comparison for timeline expansion
  const prevDates = prevProps.formattedDates;
  const nextDates = nextProps.formattedDates;
  
  // If lengths are equal, check if content is the same
  if (prevDates.length === nextDates.length) {
    return (
      prevDates[0]?.dateStr === nextDates[0]?.dateStr &&
      prevDates[prevDates.length - 1]?.dateStr === nextDates[nextDates.length - 1]?.dateStr
    );
  }
  
  // Timeline expansion detected - force re-render to show new dates
  if (nextDates.length > prevDates.length) {
    return false; // Force re-render when timeline expands
  }
  
  // Array got smaller or completely different - need re-render
  return false;
});