import { memo, useMemo } from "react";
import { Collapsible, CollapsibleContent } from "../../../ui/collapsible";
import { TimelineDayCell } from "./TimelineDayCell";
import { ProjectRow, CrewRoleCell } from "./ProjectRow";
import { UnfilledRoleBadges } from "./UnfilledRoleBadges";
import { LAYOUT } from '../constants';
import '../timeline-optimization.css';
import { EquipmentGroup, EquipmentProjectUsage, ProjectQuantityCell } from '../types';
import { analyzeFolderWarnings, getFolderWarningType } from '../utils/folderWarnings';
import { analyzeCrewWarnings, getCrewWarningType } from '../utils/crewWarnings';

// Folder warning row component that shows dots for each date with issues
const FolderWarningRow = ({ 
  folderPath, 
  formattedDates, 
  equipmentInFolder, 
  getBookingForEquipment,
  onDateSelect,
  onExpandFolder,
  onScrollToDate,
  resourceType = 'equipment'
}: {
  folderPath: string;
  formattedDates: Array<{ dateStr: string }>;
  equipmentInFolder: any[];
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any;
  onDateSelect: (date: string) => void;
  onExpandFolder: (folderPath: string) => void;
  resourceType?: 'equipment' | 'crew';
}) => {
  return (
    <div 
      className="folder-warning-row flex items-center h-full"
    >
      <div className="flex" style={{ minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px` }}>
        {formattedDates.map((dateInfo) => {
          // Check for issues based on resource type
          let hasDoubleBooking = false;
          let hasMissingAssignment = false;
          let hasOverbooking = false;
          let hasEmpty = false;
          let hasConflict = false;
          
          equipmentInFolder.forEach(resource => {
            const booking = getBookingForEquipment(resource.id, dateInfo.dateStr);
            if (resourceType === 'crew') {
              
              // For crew, check double bookings and missing assignments
              if (booking) {
                // Double booking: Multiple events on the same day
                if (booking.bookings?.length > 1) {
                  hasDoubleBooking = true;
                }
                // Missing assignment: Event needs crew but none assigned
                if (booking.needsCrew && !booking.hasAssignedCrew) {
                  hasMissingAssignment = true;
                }
              }
            } else {
              // For equipment, check overbookings and empties
              if (!booking) {
                hasEmpty = true;
              } else {
                if (booking.isOverbooked) {
                  hasOverbooking = true;
                }
                if (booking.conflict && booking.conflict.severity !== 'resolved') {
                  hasConflict = true;
                }
              }
            }
          });
          
          const warningType = resourceType === 'crew'
            ? (hasDoubleBooking ? 'critical' : hasMissingAssignment ? 'warning' : 'none')
            : (hasOverbooking || hasConflict) ? 'critical' : hasEmpty ? 'warning' : 'none';
          
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
                  title={`${folderPath}: ${
                    resourceType === 'crew'
                      ? warningType === 'critical' 
                        ? 'Double booking detected'
                        : 'Missing crew assignment'
                      : warningType === 'critical'
                        ? 'Overbookings/Conflicts'
                        : 'Empty slots'
                  } on ${dateInfo.dateStr}. Click to view details.`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // IMMEDIATE: Select date for responsive feel (scroll handled by useSimpleInfiniteScroll)
                    onDateSelect && onDateSelect(dateInfo.dateStr);
                    
                    // Expand folder (can be async)
                    onExpandFolder(folderPath);
                    
                    // Simple visual feedback
                    const button = e.currentTarget;
                    button.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                      button.style.transform = '';
                    }, 100); // Quick bounce back
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
  isUnfilledRolesSection?: boolean; // New: identifies unfilled roles sections
  filters?: any;
  onDateSelect?: (date: string) => void;

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
  isUnfilledRolesSection = false,
  filters,
  onDateSelect
}: TimelineSectionProps) => {
  const { mainFolder, equipment: mainEquipment, subFolders } = equipmentGroup;
  
  // IMPROVED: Unified expansion logic that prevents conflicts
  const hasActiveFilters = filters && (filters.search || filters.equipmentType || filters.crewRole);
  const isExpanded = useMemo(() => {
    // When filters are active and group has forced expansion state, use it
    if (hasActiveFilters && equipmentGroup.isExpanded !== undefined) {
      return equipmentGroup.isExpanded;
    }
    
    // Otherwise, use persistent expansion state
    return expandedGroups.has(mainFolder);
  }, [hasActiveFilters, equipmentGroup.isExpanded, expandedGroups, mainFolder]);
  
  // PERFORMANCE: Pre-calculate timeline width once for all equipment
  const timelineWidthPx = useMemo(() => 
    formattedDates.length * LAYOUT.DAY_CELL_WIDTH, 
    [formattedDates.length]
  );

  return (
    <Collapsible open={isExpanded}>
      {/* CRITICAL FIX: Add folder header spacer to match ResourceFolderSection trigger */}
      <div 
        className="folder-header-spacer border-b border-border bg-background"
        style={{ height: LAYOUT.MAIN_FOLDER_HEIGHT }}
      >
        {/* Invisible spacer to align with folder header in ResourceFolderSection */}
      </div>
      
      <CollapsibleContent>
        {/* Main folder equipment/roles timeline */}
        {mainEquipment.map((equipment) => {

          // Standard equipment/crew timeline
          const isEquipmentExpanded = expandedEquipment.has(equipment.id);
          const equipmentUsage = equipmentProjectUsage.get(equipment.id);
          
          return (
            <div key={equipment.id}>
              {/* Main equipment row */}
              <div 
                className={`equipment-row flex items-center border-b border-border/50 transition-all duration-200 ${!isUnfilledRolesSection ? 'hover:bg-muted/30' : ''}`}
                style={{ 
                  height: LAYOUT.EQUIPMENT_ROW_HEIGHT, // FIXED: Use same height as ResourceFolderSection
                  backgroundColor: isUnfilledRolesSection ? 'transparent' : undefined
                }}
              >
                {/* Timeline cells - NO MORE DUPLICATE NAME COLUMN! */}
                <div 
                  className="flex items-center" 
                  style={{ 
                    minWidth: `${timelineWidthPx}px`,
                    height: '100%'
                  }}
                >
                                                       {formattedDates.map((dateInfo, index) => {
                    if (isUnfilledRolesSection) {
                      const booking = getBookingForEquipment(equipment.id, dateInfo.dateStr);
                      const needsCrew = booking?.needsCrew && !booking?.hasAssignedCrew;
                      
                      return (
                        <div
                          key={dateInfo.date.toISOString()}
                          className="flex items-center justify-center h-full"
                          style={{ 
                            width: LAYOUT.DAY_CELL_WIDTH,
                            minHeight: LAYOUT.PROJECT_ROW_HEIGHT
                          }}
                        >
                          <UnfilledRoleBadges
                            roles={needsCrew ? [{
                              id: equipment.id,
                              role: '',
                              projectName: booking.projectName || '',
                              eventName: booking.eventName || '',
                              eventTypeColor: booking.eventTypeColor || '#666'
                            }] : []}
                            dateStr={dateInfo.dateStr}
                            onRoleClick={(roleId, date) => {
                              onDateSelect?.(date);

                            }}
                          />
                        </div>
                      );
                    }

                    return (
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
                    );
                  })}
                </div>
              </div>
              
              {/* Project breakdown rows when expanded - only show for regular crew, not unfilled roles */}
              {!isUnfilledRolesSection && isEquipmentExpanded && (
                <div className="project-rows-container transition-all duration-200">{/* NO MORE DUPLICATE NAME OVERLAY! */}

                  {/* Project rows or empty state */}
                  <div className="relative">
                    {equipmentUsage && equipmentUsage.projectNames.length > 0 ? (
                      equipmentUsage.projectNames.map((projectName) => (
                        <ProjectRow
                          key={`${equipment.id}-${projectName}`}
                          projectName={projectName}
                          equipmentId={equipment.id}
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
                        {/* Empty timeline - NO MORE DUPLICATE NAME COLUMN! */}
                        <div 
                          className="flex items-center justify-center text-xs text-muted-foreground"
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
              {/* CRITICAL FIX: Add subfolder header spacer to match ResourceFolderSection */}
              <div 
                className="subfolder-header-spacer border-t border-b border-border bg-muted/50"
                style={{ height: LAYOUT.SUBFOLDER_HEIGHT }}
              >
                {/* Invisible spacer to align with subfolder header in ResourceFolderSection */}
              </div>
              
              <CollapsibleContent>
                {subFolder.equipment.map((equipment) => {

                  const isEquipmentExpanded = expandedEquipment.has(equipment.id);
                  const equipmentUsage = equipmentProjectUsage.get(equipment.id);
                  
                  return (
                    <div key={equipment.id}>
                      {/* Main equipment row */}
                      <div 
                        className={`equipment-row flex items-center border-b border-border transition-all duration-200 ${!isUnfilledRolesSection ? 'hover:bg-muted/30' : ''}`}
                        style={{ 
                          height: LAYOUT.EQUIPMENT_ROW_HEIGHT, // FIXED: Always use EQUIPMENT_ROW_HEIGHT to match ResourceFolderSection
                          backgroundColor: isUnfilledRolesSection ? 'transparent' : undefined
                        }}
                      >
                        {/* Timeline cells - NO MORE DUPLICATE NAME COLUMN! */}
                        <div 
                          className="flex items-center" 
                          style={{ 
                            minWidth: `${timelineWidthPx}px`,
                            height: '100%',
                            marginLeft: 0
                          }}
                        >
                                            {formattedDates.map((dateInfo, index) => {
                    if (isUnfilledRolesSection) {
                      const booking = getBookingForEquipment(equipment.id, dateInfo.dateStr);
                      const needsCrew = booking?.needsCrew && !booking?.hasAssignedCrew;
                      
                      return (
                        <div
                          key={dateInfo.date.toISOString()}
                          className="flex items-center justify-center h-full"
                          style={{ 
                            width: LAYOUT.DAY_CELL_WIDTH,
                            minHeight: LAYOUT.PROJECT_ROW_HEIGHT
                          }}
                        >
                          <UnfilledRoleBadges
                            roles={needsCrew ? [{
                              id: equipment.id,
                              role: '',
                              projectName: booking.projectName || '',
                              eventName: booking.eventName || '',
                              eventTypeColor: booking.eventTypeColor || '#666'
                            }] : []}
                            dateStr={dateInfo.dateStr}
                            onRoleClick={(roleId, date) => {
                              onDateSelect?.(date);

                            }}
                          />
                        </div>
                      );
                    }

                            return (
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
                            );
                          })}
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
                {/* Timeline area - NO MORE DUPLICATE NAME COLUMN! */}
                <div 
                  className="flex items-center justify-center text-xs text-muted-foreground"
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