import { memo, useMemo } from "react";
import { Collapsible, CollapsibleContent } from "../../../ui/collapsible";
import { TimelineDayCell } from "./TimelineDayCell";
import { ProjectRow, CrewRoleCell } from "./ProjectRow";
import { LAYOUT } from '../constants';
import '../timeline-optimization.css';
import { EquipmentGroup, EquipmentProjectUsage, ProjectQuantityCell } from '../types';

interface TimelineSectionProps {
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
  getCrewRoleForDate?: (projectName: string, crewMemberId: string, dateStr: string) => CrewRoleCell | undefined;
  onToggleEquipmentExpansion: (equipmentId: string) => void; // New: handle equipment expansion
  resourceType?: 'equipment' | 'crew'; // Added prop to indicate resource type
  filters?: any; // Add filters to detect when filtering is active
}

const TimelineSectionComponent = ({
  equipmentGroup,
  expandedGroups,
  expandedEquipment,
  equipmentProjectUsage,
  formattedDates,
  getBookingForEquipment,
  getProjectQuantityForDate,
  getCrewRoleForDate,
  onToggleEquipmentExpansion,
  resourceType = 'equipment',
  filters
}: TimelineSectionProps) => {
  const { mainFolder, equipment: mainEquipment, subFolders } = equipmentGroup;
  
  // Only use forced expansion when filters are active, otherwise use normal expansion logic
  const hasActiveFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
  const isExpanded = hasActiveFilters && equipmentGroup.isExpanded !== undefined 
    ? equipmentGroup.isExpanded 
    : expandedGroups.has(mainFolder);
  
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
                    <TimelineDayCell
                      key={dateInfo.date.toISOString()}
                      equipment={equipment}
                      dateInfo={dateInfo}
                      getBookingForEquipment={getBookingForEquipment}
                      isExpanded={isEquipmentExpanded}
                      onToggleExpansion={onToggleEquipmentExpansion}
                      isFirstCell={index === 0} // Only show toggle on first cell
                      isCrew={resourceType === 'crew'}
                    />
                  ))}
                </div>
              </div>
              
              {/* Project breakdown rows when expanded - always show, even if no projects */}
              {isEquipmentExpanded && (
                <div>
                  {equipmentUsage && equipmentUsage.projectNames.length > 0 ? (
                    equipmentUsage.projectNames.map((projectName) => (
                      <ProjectRow
                        key={`${equipment.id}-${projectName}`}
                        projectName={projectName}
                        equipmentId={equipment.id}
                        resourceName={equipment.name}
                        formattedDates={formattedDates}
                        getProjectQuantityForDate={resourceType === 'equipment' ? getProjectQuantityForDate : undefined}
                        getCrewRoleForDate={resourceType === 'crew' ? getCrewRoleForDate : undefined}
                        isCrew={resourceType === 'crew'}
                      />
                    ))
                  ) : (
                    <div 
                      className="project-row flex items-center border-b border-gray-300 bg-gray-500"
                      style={{ height: LAYOUT.PROJECT_ROW_HEIGHT / 2 }}
                    >
                      <div 
                        className="flex items-center justify-center text-gray-400 text-sm"
                        style={{ 
                          minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px`,
                          height: '100%'
                        }}
                      >
                        No project assignments
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Subfolders timeline */}
        {subFolders.map((subFolder) => {
          const subFolderKey = `${mainFolder}/${subFolder.name}`;
          // Only use forced expansion when filters are active, otherwise use normal expansion logic
          const isSubfolderExpanded = hasActiveFilters && subFolder.isExpanded !== undefined 
            ? subFolder.isExpanded 
            : expandedGroups.has(subFolderKey);
          
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
                            <TimelineDayCell
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
                      
                      {/* Project breakdown rows when expanded - always show, even if no projects */}
                      {isEquipmentExpanded && (
                        <div className="project-rows-expanded">
                          {equipmentUsage && equipmentUsage.projectNames.length > 0 ? (
                            equipmentUsage.projectNames.map((projectName) => (
                              <ProjectRow
                                key={`${equipment.id}-${projectName}`}
                                projectName={projectName}
                                equipmentId={equipment.id}
                                resourceName={equipment.name}
                                formattedDates={formattedDates}
                                getProjectQuantityForDate={resourceType === 'equipment' ? getProjectQuantityForDate : undefined}
                                getCrewRoleForDate={resourceType === 'crew' ? getCrewRoleForDate : undefined}
                                isCrew={resourceType === 'crew'}
                              />
                            ))
                          ) : (
                            <div 
                              className="project-row flex items-center border-b border-gray-300 bg-gray-500"
                              style={{ height: LAYOUT.PROJECT_ROW_HEIGHT / 2 }}
                            >
                              <div 
                                className="flex items-center justify-center text-gray-400 text-sm"
                                style={{ 
                                  minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px`,
                                  height: '100%'
                                }}
                              >
                                No project assignments
                              </div>
                            </div>
                          )}
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

// Much simpler memoization - let React handle most optimizations
export const TimelineSection = memo(TimelineSectionComponent);