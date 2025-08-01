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
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  getBookingsForEquipment: (equipmentId: string, dateStr: string, equipment: any) => any;
  getBookingState: (equipmentId: string, dateStr: string) => any;
  updateBookingState: (equipmentId: string, dateStr: string, state: any) => void;
  onDateChange: (date: Date) => void;
}

export function EquipmentTimelineSection({
  equipmentGroup,
  expandedGroups,
  formattedDates,
  getBookingsForEquipment,
  getBookingState,
  updateBookingState,
  onDateChange
}: EquipmentTimelineSectionProps) {
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
}