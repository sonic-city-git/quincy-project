import { memo } from "react";
import { Collapsible, CollapsibleContent } from "../../ui/collapsible";
import { EquipmentDayCell } from "./EquipmentDayCell";
import { LAYOUT } from '../constants';
import { EquipmentGroup } from '../types';

interface EquipmentTimelineSectionProps {
  equipmentGroup: EquipmentGroup;
  expandedGroups: Set<string>;
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  getBookingsForEquipment: (equipmentId: string, dateStr: string, equipment: any) => any;
  getBookingState: (equipmentId: string, dateStr: string) => any;
  updateBookingState: (equipmentId: string, dateStr: string, state: any) => void;
  onDateChange: (date: Date) => void;
}

const EquipmentTimelineSectionComponent = ({
  equipmentGroup,
  expandedGroups,
  formattedDates,
  getBookingsForEquipment,
  getBookingState,
  updateBookingState,
  onDateChange
}: EquipmentTimelineSectionProps) => {
  const { mainFolder, equipment: mainEquipment, subFolders } = equipmentGroup;
  const isExpanded = expandedGroups.has(mainFolder);

  return (
    <Collapsible open={isExpanded}>
      <div style={{ height: LAYOUT.MAIN_FOLDER_HEIGHT }} className="border-b border-border" />
      
      <CollapsibleContent>
        {/* Main folder equipment timeline */}
        {mainEquipment.map((equipment) => (
          <div 
            key={equipment.id} 
            className="flex items-center border-b border-border hover:bg-muted/30 transition-colors"
            style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}
          >
            <div className="flex" style={{ minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px` }}>
              {formattedDates.map(dateInfo => (
                <EquipmentDayCell
                  key={dateInfo.date.toISOString()}
                  equipment={equipment}
                  dateInfo={dateInfo}
                  getBookingsForEquipment={getBookingsForEquipment}
                  getBookingState={getBookingState}
                  updateBookingState={updateBookingState}
                  onDateChange={onDateChange}
                />
              ))}
            </div>
          </div>
        ))}
        
        {/* Subfolders timeline */}
        {subFolders.map((subFolder) => {
          const subFolderKey = `${mainFolder}/${subFolder.name}`;
          const isSubfolderExpanded = expandedGroups.has(subFolderKey);
          
          return (
            <Collapsible key={subFolder.name} open={isSubfolderExpanded}>
              <div style={{ height: LAYOUT.SUBFOLDER_HEIGHT }} className="border-t border-border" />
              <CollapsibleContent>
                {subFolder.equipment.map((equipment) => (
                  <div 
                    key={equipment.id} 
                    className="flex items-center border-b border-border hover:bg-muted/30 transition-colors"
                    style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}
                  >
                    <div className="flex" style={{ minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px` }}>
                      {formattedDates.map(dateInfo => (
                        <EquipmentDayCell
                          key={dateInfo.date.toISOString()}
                          equipment={equipment}
                          dateInfo={dateInfo}
                          getBookingsForEquipment={getBookingsForEquipment}
                          getBookingState={getBookingState}
                          updateBookingState={updateBookingState}
                          onDateChange={onDateChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
};

// Smart memoization that handles timeline expansion gracefully
export const EquipmentTimelineSection = memo(EquipmentTimelineSectionComponent, (prevProps, nextProps) => {
  // Equipment group must be the same
  if (prevProps.equipmentGroup.mainFolder !== nextProps.equipmentGroup.mainFolder) {
    return false;
  }
  
  // Expanded state must be the same
  if (prevProps.expandedGroups !== nextProps.expandedGroups) {
    return false;
  }
  
  // Smart date comparison - allow expansion but not complete replacement
  const prevDates = prevProps.formattedDates;
  const nextDates = nextProps.formattedDates;
  
  // If array length is the same, just check first and last dates
  if (prevDates.length === nextDates.length) {
    return (
      prevDates[0]?.dateStr === nextDates[0]?.dateStr &&
      prevDates[prevDates.length - 1]?.dateStr === nextDates[nextDates.length - 1]?.dateStr
    );
  }
  
  // If next array is longer (expansion), always re-render to show new dates
  if (nextDates.length > prevDates.length) {
    return false; // Force re-render when timeline expands
  }
  
  // Array got smaller or completely different - need re-render
  return false;
});