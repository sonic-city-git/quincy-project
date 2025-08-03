import { memo, useMemo } from "react";
import { Collapsible, CollapsibleContent } from "../../../ui/collapsible";
import { TimelineDayCell } from "./TimelineDayCell";
import { ProjectRow, CrewRoleCell } from "./ProjectRow";
import { LAYOUT } from '../constants';
import '../timeline-optimization.css';
import { EquipmentGroup, EquipmentProjectUsage, ProjectQuantityCell } from '../types';
import { analyzeFolderWarnings, getFolderWarningType } from '../utils/folderWarnings';

// Folder warning row component that shows dots for each date with issues
const FolderWarningRow = ({ 
  folderPath, 
  formattedDates, 
  equipmentInFolder, 
  getBookingForEquipment,
  onDateSelect,
  onExpandFolder,
  onScrollToDate
}: {
  folderPath: string;
  formattedDates: Array<{ dateStr: string }>;
  equipmentInFolder: any[];
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any;
  onDateSelect: (date: string) => void;
  onExpandFolder: (folderPath: string) => void;
  onScrollToDate: (date: string) => void;
}) => {
  return (
    <div 
      className="folder-warning-row flex items-center h-full"
    >
      <div className="flex" style={{ minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px` }}>
        {formattedDates.map((dateInfo) => {
          // Check if any equipment in this folder has issues on this date
          let hasOverbooking = false;
          let hasEmpty = false;
          let hasConflict = false;
          
          equipmentInFolder.forEach(equipment => {
            const booking = getBookingForEquipment(equipment.id, dateInfo.dateStr);
            if (!booking) {
              hasEmpty = true;
            } else {
              if (booking.isOverbooked) hasOverbooking = true;
              if (booking.conflict && booking.conflict.severity !== 'resolved') hasConflict = true;
            }
          });
          
          const warningType = (hasOverbooking || hasConflict) ? 'critical' : hasEmpty ? 'warning' : 'none';
          
          return (
            <div 
              key={dateInfo.dateStr}
              className="flex items-center justify-center"
              style={{ width: LAYOUT.DAY_CELL_WIDTH }}
            >
              {warningType !== 'none' && (
                <button
                  type="button"
                  className={`w-4 h-4 rounded-full cursor-pointer transition-all duration-300 ease-out 
                    hover:scale-125 hover:shadow-lg active:scale-95 ${
                    warningType === 'critical' 
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                      : 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20'
                  }`}
                  title={`${folderPath}: ${warningType === 'critical' ? 'Overbookings/Conflicts' : 'Empty slots'} on ${dateInfo.dateStr}. Click to view details.`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Animate the dot on click
                    const button = e.currentTarget;
                    button.style.transform = 'scale(0.8)';
                    
                    // Expand folder first
                    onExpandFolder(folderPath);
                    
                    // Sequence the animations
                    setTimeout(() => {
                      // Reset the button scale
                      button.style.transform = '';
                      
                      // Select and scroll after folder expansion
                      setTimeout(() => {
                        onDateSelect(dateInfo.dateStr);
                        onScrollToDate(dateInfo.dateStr);
                      }, 150);
                    }, 150);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
  onToggleEquipmentExpansion: (equipmentId: string) => void;
  onToggleGroupExpansion?: (groupPath: string) => void; // For expanding folders
  resourceType?: 'equipment' | 'crew';
  filters?: any;
  onDateSelect?: (date: string) => void;
  onScrollToDate?: (date: string) => void;
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
  onToggleGroupExpansion,
  resourceType = 'equipment',
  filters,
  onDateSelect,
  onScrollToDate
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
      <div style={{ height: LAYOUT.MAIN_FOLDER_HEIGHT }} className="border-b border-border bg-muted/10">
        <FolderWarningRow 
          folderPath={mainFolder}
          formattedDates={formattedDates}
          equipmentInFolder={mainEquipment}
          getBookingForEquipment={getBookingForEquipment}
          onDateSelect={onDateSelect || (() => {})}
          onExpandFolder={() => onToggleGroupExpansion ? onToggleGroupExpansion(mainFolder) : null}
          onScrollToDate={onScrollToDate || (() => {})}
        />
      </div>
      
      <CollapsibleContent>
        {/* Main folder equipment timeline - OPTIMIZED */}
        {mainEquipment.map((equipment) => {
          const isEquipmentExpanded = expandedEquipment.has(equipment.id);
          const equipmentUsage = equipmentProjectUsage.get(equipment.id);
          
          return (
            <div key={equipment.id}>
              {/* Main equipment row */}
              <div 
                className="equipment-row flex items-center border-b border-border hover:bg-muted/30 transition-all duration-200"
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
                <div className="project-rows-container transition-all duration-200">
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
                      className="project-row flex items-center border-b border-border/50 bg-muted/20"
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
              <div style={{ height: LAYOUT.SUBFOLDER_HEIGHT }} className="border-t border-border bg-muted/5">
                <FolderWarningRow 
                  folderPath={subFolderKey}
                  formattedDates={formattedDates}
                  equipmentInFolder={subFolder.equipment}
                  getBookingForEquipment={getBookingForEquipment}
                  onDateSelect={onDateSelect || (() => {})}
                  onExpandFolder={() => onToggleGroupExpansion ? onToggleGroupExpansion(subFolderKey) : null}
                  onScrollToDate={onScrollToDate || (() => {})}
                />
              </div>
              
              <CollapsibleContent>
                {subFolder.equipment.map((equipment) => {
                  const isEquipmentExpanded = expandedEquipment.has(equipment.id);
                  const equipmentUsage = equipmentProjectUsage.get(equipment.id);
                  
                  return (
                    <div key={equipment.id}>
                      {/* Main equipment row */}
                      <div 
                        className="equipment-row flex items-center border-b border-border hover:bg-muted/30 transition-all duration-200"
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
                        <div className="project-rows-expanded project-rows-container transition-all duration-200">
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
                              className="project-row flex items-center border-b border-border/50 bg-muted/20"
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