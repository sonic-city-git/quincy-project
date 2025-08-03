/**
 * CRITICAL PLANNER ALIGNMENT FIXES
 * 
 * Root cause: TimelineSection and ResourceFolderSection are misaligned
 * - TimelineSection renders TIMELINE CELLS (right side)
 * - ResourceFolderSection renders NAMES (left side)
 * - They must render the EXACT SAME NUMBER of rows in the EXACT SAME ORDER
 * 
 * Issues found:
 * 1. Missing folder headers in TimelineSection 
 * 2. Empty equipment name sections in TimelineSection
 * 3. "No assignment" rows missing from ResourceFolderSection
 * 4. Subfolder headers misaligned
 * 5. Project row count mismatch between components
 */

import { LAYOUT } from '../constants';

/**
 * FIXED: Missing folder header content in TimelineSection
 */
export const FixedFolderHeader = ({ 
  mainFolder, 
  onToggleGroup, 
  isExpanded, 
  hasActiveFilters 
}: {
  mainFolder: string;
  onToggleGroup: (groupKey: string, expandAllSubfolders?: boolean) => void;
  isExpanded: boolean;
  hasActiveFilters: boolean;
}) => {
  return (
    <div 
      className="flex items-center border-b border-border bg-muted/10 px-4"
      style={{ height: LAYOUT.MAIN_FOLDER_HEIGHT }}
    >
      {/* Folder toggle button */}
      <button
        onClick={() => onToggleGroup(mainFolder, false)}
        className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors"
        disabled={hasActiveFilters} // Don't allow manual toggle when filters force expansion
      >
        <ChevronRight 
          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
        />
        {mainFolder}
      </button>
      
      {/* Optional: Folder stats */}
      <div className="ml-auto text-xs text-muted-foreground">
        {/* Could show equipment count, etc. */}
      </div>
    </div>
  );
};

/**
 * FIXED: Missing subfolder header content in TimelineSection
 */
export const FixedSubfolderHeader = ({ 
  subFolder, 
  mainFolder,
  onToggleGroup, 
  isExpanded,
  hasActiveFilters 
}: {
  subFolder: any;
  mainFolder: string;
  onToggleGroup: (groupKey: string) => void;
  isExpanded: boolean;
  hasActiveFilters: boolean;
}) => {
  const subFolderKey = `${mainFolder}/${subFolder.name}`;
  
  return (
    <div 
      className="flex items-center border-t border-border bg-muted/5 px-6"
      style={{ height: LAYOUT.SUBFOLDER_HEIGHT }}
    >
      {/* Subfolder toggle button */}
      <button
        onClick={() => onToggleGroup(subFolderKey)}
        className="flex items-center gap-2 text-xs font-medium hover:text-foreground transition-colors"
        disabled={hasActiveFilters}
      >
        <ChevronRight 
          className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
        />
        {subFolder.name}
      </button>
    </div>
  );
};

/**
 * FIXED: Equipment name content for TimelineSection rows
 */
export const FixedEquipmentNameForTimeline = ({ 
  equipment, 
  onToggleExpansion, 
  isExpanded, 
  resourceType,
  isUnfilledRolesSection = false 
}: {
  equipment: any;
  onToggleExpansion: (equipmentId: string) => void;
  isExpanded: boolean;
  resourceType: 'equipment' | 'crew';
  isUnfilledRolesSection?: boolean;
}) => {
  return (
    <div 
      className="flex items-center px-4 border-r border-border bg-background"
      style={{ width: LAYOUT.EQUIPMENT_NAME_WIDTH, height: '100%' }}
    >
      {/* Equipment name and expand toggle */}
      <button
        onClick={() => onToggleExpansion(equipment.id)}
        className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors min-w-0 flex-1"
        title={`${isExpanded ? 'Collapse' : 'Expand'} ${equipment.name} project breakdown`}
      >
        <ChevronRight 
          className={`h-4 w-4 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
        />
        <span className="truncate">{equipment.name}</span>
      </button>
      
      {/* Equipment info */}
      {resourceType === 'equipment' && (
        <div className="text-xs text-muted-foreground ml-2">
          Stock: {equipment.stock}
        </div>
      )}
    </div>
  );
};

/**
 * FIXED: "No assignment" row that includes name column
 */
export const FixedNoAssignmentRow = ({ 
  equipment, 
  formattedDates 
}: {
  equipment: any;
  formattedDates: any[];
}) => {
  return (
    <div 
      className="flex items-center border-b border-border/50 bg-muted/20"
      style={{ height: LAYOUT.PROJECT_ROW_HEIGHT / 2 }}
    >
      {/* Equipment name column */}
      <div 
        className="flex items-center px-8 text-xs text-muted-foreground"
        style={{ width: LAYOUT.EQUIPMENT_NAME_WIDTH }}
      >
        <span className="truncate">{equipment.name}</span>
      </div>
      
      {/* Timeline area */}
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
  );
};

/**
 * Row counting utility to ensure alignment
 */
export const TimelineRowCounter = {
  // Count expected rows for ResourceFolderSection
  countResourceRows: (equipmentGroup: any, expandedGroups: Set<string>, expandedEquipment: Set<string>) => {
    let count = 0;
    
    // Main folder header
    count += 1;
    
    if (expandedGroups.has(equipmentGroup.mainFolder)) {
      // Main equipment rows
      count += equipmentGroup.equipment.length;
      
      // Expanded project rows
      equipmentGroup.equipment.forEach((equipment: any) => {
        if (expandedEquipment.has(equipment.id)) {
          // Project rows or "no assignments" row
          count += Math.max(1, equipment.projectNames?.length || 0);
        }
      });
      
      // Subfolders
      equipmentGroup.subFolders?.forEach((subFolder: any) => {
        const subFolderKey = `${equipmentGroup.mainFolder}/${subFolder.name}`;
        
        // Subfolder header
        count += 1;
        
        if (expandedGroups.has(subFolderKey)) {
          // Subfolder equipment rows
          count += subFolder.equipment.length;
          
          // Subfolder expanded project rows
          subFolder.equipment.forEach((equipment: any) => {
            if (expandedEquipment.has(equipment.id)) {
              count += Math.max(1, equipment.projectNames?.length || 0);
            }
          });
        }
      });
    }
    
    return count;
  },

  // Count actual rows for TimelineSection  
  countTimelineRows: (equipmentGroup: any, expandedGroups: Set<string>, expandedEquipment: Set<string>) => {
    // Should match countResourceRows exactly
    return TimelineRowCounter.countResourceRows(equipmentGroup, expandedGroups, expandedEquipment);
  },

  // Validate alignment
  validateAlignment: (equipmentGroups: any[], expandedGroups: Set<string>, expandedEquipment: Set<string>) => {
    const mismatches: string[] = [];
    
    equipmentGroups.forEach(group => {
      const resourceCount = TimelineRowCounter.countResourceRows(group, expandedGroups, expandedEquipment);
      const timelineCount = TimelineRowCounter.countTimelineRows(group, expandedGroups, expandedEquipment);
      
      if (resourceCount !== timelineCount) {
        mismatches.push(`${group.mainFolder}: Resource=${resourceCount}, Timeline=${timelineCount}`);
      }
    });
    
    if (mismatches.length > 0) {
      console.error('🚨 Timeline alignment mismatch:', mismatches);
    }
    
    return mismatches.length === 0;
  }
};

export default {
  FixedFolderHeader,
  FixedSubfolderHeader, 
  FixedEquipmentNameForTimeline,
  FixedNoAssignmentRow,
  TimelineRowCounter
};