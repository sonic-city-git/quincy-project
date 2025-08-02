import { memo, useMemo } from "react";
import { Collapsible, CollapsibleContent } from "../../ui/collapsible";
import { EquipmentDayCell } from "./EquipmentDayCell";
import { ProjectRow } from "./ProjectRow";
import { LAYOUT } from '../constants';
import './equipment-expansion.css';
import { EquipmentGroup, EquipmentProjectUsage, ProjectQuantityCell } from '../types';

interface EquipmentTimelineSectionProps {
  equipmentGroup: EquipmentGroup;
  expandedGroups: Set<string>;
  expandedEquipment: Set<string>; // New: track equipment-level expansion
  equipmentProjectUsage: Map<string, EquipmentProjectUsage>; // New: project usage data
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any;
  getProjectQuantityForDate: (projectName: string, equipmentId: string, dateStr: string) => ProjectQuantityCell | undefined;
  onToggleEquipmentExpansion: (equipmentId: string) => void; // New: handle equipment expansion
}

const EquipmentTimelineSectionComponent = ({
  equipmentGroup,
  expandedGroups,
  expandedEquipment,
  equipmentProjectUsage,
  formattedDates,
  getBookingForEquipment,
  getProjectQuantityForDate,
  onToggleEquipmentExpansion
}: EquipmentTimelineSectionProps) => {
  const { mainFolder, equipment: mainEquipment, subFolders } = equipmentGroup;
  const isExpanded = expandedGroups.has(mainFolder);
  
  // PERFORMANCE: Pre-calculate timeline width once for all equipment
  const timelineWidthPx = useMemo(() => 
    formattedDates.length * LAYOUT.DAY_CELL_WIDTH, 
    [formattedDates.length]
  );

  return (
    <Collapsible open={isExpanded}>
      <div style={{ height: LAYOUT.MAIN_FOLDER_HEIGHT }} className="border-b border-border" />
      
      <CollapsibleContent>
        {/* Main folder equipment timeline - OPTIMIZED */}
        {mainEquipment.map((equipment) => {
          const isEquipmentExpanded = expandedEquipment.has(equipment.id);
          const equipmentUsage = equipmentProjectUsage.get(equipment.id);
          
          return (
            <div key={equipment.id}>
              {/* Main equipment row */}
              <div 
                className="equipment-row flex items-center border-b border-border hover:bg-muted/30 transition-colors"
                style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}
              >
                <div 
                  className="flex items-center" 
                  style={{ 
                    minWidth: `${timelineWidthPx}px`,
                    height: '100%'
                  }}
                >
                  {formattedDates.map((dateInfo, index) => (
                    <EquipmentDayCell
                      key={dateInfo.date.toISOString()}
                      equipment={equipment}
                      dateInfo={dateInfo}
                      getBookingForEquipment={getBookingForEquipment}
                      isExpanded={isEquipmentExpanded}
                      onToggleExpansion={onToggleEquipmentExpansion}
                      isFirstCell={index === 0} // Only show toggle on first cell
                    />
                  ))}
                </div>
              </div>
              
              {/* Project breakdown rows when expanded */}
              {isEquipmentExpanded && equipmentUsage && equipmentUsage.projectNames.length > 0 && (
                <div>
                  {equipmentUsage.projectNames.map((projectName) => (
                    <ProjectRow
                      key={`${equipment.id}-${projectName}`}
                      projectName={projectName}
                      equipmentId={equipment.id}
                      formattedDates={formattedDates}
                      getProjectQuantityForDate={getProjectQuantityForDate}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Subfolders timeline */}
        {subFolders.map((subFolder) => {
          const subFolderKey = `${mainFolder}/${subFolder.name}`;
          const isSubfolderExpanded = expandedGroups.has(subFolderKey);
          
          return (
            <Collapsible key={subFolder.name} open={isSubfolderExpanded}>
              <div style={{ height: LAYOUT.SUBFOLDER_HEIGHT }} className="border-t border-border" />
              <CollapsibleContent>
                {subFolder.equipment.map((equipment) => {
                  const isEquipmentExpanded = expandedEquipment.has(equipment.id);
                  const equipmentUsage = equipmentProjectUsage.get(equipment.id);
                  
                  return (
                    <div key={equipment.id}>
                      {/* Main equipment row */}
                      <div 
                        className="equipment-row flex items-center border-b border-border hover:bg-muted/30 transition-colors"
                        style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}
                      >
                        <div 
                          className="flex items-center" 
                          style={{ 
                            minWidth: `${timelineWidthPx}px`,
                            height: '100%'
                          }}
                        >
                          {formattedDates.map((dateInfo, index) => (
                            <EquipmentDayCell
                              key={dateInfo.date.toISOString()}
                              equipment={equipment}
                              dateInfo={dateInfo}
                              getBookingForEquipment={getBookingForEquipment}
                              isExpanded={isEquipmentExpanded}
                              onToggleExpansion={onToggleEquipmentExpansion}
                              isFirstCell={index === 0} // Only show toggle on first cell
                            />
                          ))}
                        </div>
                      </div>
                      
                      {/* Project breakdown rows when expanded */}
                      {isEquipmentExpanded && equipmentUsage && equipmentUsage.projectNames.length > 0 && (
                        <div className="project-rows-expanded">
                          {equipmentUsage.projectNames.map((projectName) => (
                            <ProjectRow
                              key={`${equipment.id}-${projectName}`}
                              projectName={projectName}
                              equipmentId={equipment.id}
                              formattedDates={formattedDates}
                              getProjectQuantityForDate={getProjectQuantityForDate}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
  
  // Expanded state must be the same (folder-level)
  if (prevProps.expandedGroups !== nextProps.expandedGroups) {
    return false;
  }
  
  // Equipment expansion state must be the same
  if (prevProps.expandedEquipment !== nextProps.expandedEquipment) {
    return false;
  }
  
  // Equipment project usage data must be the same
  if (prevProps.equipmentProjectUsage !== nextProps.equipmentProjectUsage) {
    return false;
  }
  
  // Equipment expansion toggle function must be the same
  if (prevProps.onToggleEquipmentExpansion !== nextProps.onToggleEquipmentExpansion) {
    return false;
  }
  
  // Project quantity function must be the same
  if (prevProps.getProjectQuantityForDate !== nextProps.getProjectQuantityForDate) {
    return false;
  }
  
  // CRITICAL: Check if booking function changed - this ensures day cells update with new data
  if (prevProps.getBookingForEquipment !== nextProps.getBookingForEquipment) {
    return false; // Force re-render when booking function changes
  }
  
  // Smart date comparison - allow expansion but not complete replacement
  const prevDates = prevProps.formattedDates;
  const nextDates = nextProps.formattedDates;
  
  // If array length is the same, check first/last dates AND selected date changes
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
  
  // If next array is longer (expansion), always re-render to show new dates
  if (nextDates.length > prevDates.length) {
    return false; // Force re-render when timeline expands
  }
  
  // Array got smaller or completely different - need re-render
  return false;
});