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
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  getBookingsForEquipment: (equipmentId: string, dateStr: string, equipment: any) => any;
  getBookingState: (equipmentId: string, dateStr: string) => any;
  updateBookingState: (equipmentId: string, dateStr: string, state: any) => void;
  onDateChange: (date: Date) => void;
  getLowestAvailable: (equipmentId: string) => number;
  equipmentRowsRef: React.RefObject<HTMLDivElement>;
  handleTimelineScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  handleTimelineMouseMove: (e: React.MouseEvent) => void;
  scrollHandlers: {
    handleMouseDown: (e: React.MouseEvent) => void;
    handleMouseUp: () => void;
    handleMouseLeave: () => void;
  };
  isDragging: boolean;
}

export function EquipmentCalendarContent({
  equipmentGroups,
  expandedGroups,
  toggleGroup,
  formattedDates,
  getBookingsForEquipment,
  getBookingState,
  updateBookingState,
  onDateChange,
  getLowestAvailable,
  equipmentRowsRef,
  handleTimelineScroll,
  handleTimelineMouseMove,
  scrollHandlers,
  isDragging
}: EquipmentCalendarContentProps) {
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
                getBookingsForEquipment={getBookingsForEquipment}
                getBookingState={getBookingState}
                updateBookingState={updateBookingState}
                onDateChange={onDateChange}
              />
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}