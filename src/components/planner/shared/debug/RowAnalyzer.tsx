/**
 * PLANNER ALIGNMENT DEBUG ANALYZER
 * 
 * This component helps debug exactly why ResourceFolderSection and TimelineSection
 * are rendering different numbers of rows causing misalignment.
 */

import { LAYOUT } from '../constants';

export interface RowAnalysis {
  component: 'ResourceFolder' | 'Timeline';
  rowType: 'mainFolder' | 'subfolder' | 'equipment' | 'project' | 'empty';
  height: number;
  content: string;
  isCollapsible: boolean;
  isExpanded?: boolean;
}

/**
 * Analyze what rows ResourceFolderSection would render
 */
export function analyzeResourceFolderRows(
  equipmentGroup: any,
  expandedGroups: Set<string>,
  expandedEquipment: Set<string>,
  equipmentProjectUsage: Map<string, any>,
  isUnfilledRolesSection: boolean = false
): RowAnalysis[] {
  const rows: RowAnalysis[] = [];
  const { mainFolder, equipment: mainEquipment, subFolders } = equipmentGroup;
  
  // 1. Main folder header (CollapsibleTrigger)
  rows.push({
    component: 'ResourceFolder',
    rowType: 'mainFolder',
    height: LAYOUT.MAIN_FOLDER_HEIGHT,
    content: `📁 ${mainFolder}`,
    isCollapsible: true,
    isExpanded: expandedGroups.has(mainFolder)
  });
  
  // 2. Main equipment rows (if folder is expanded)
  if (expandedGroups.has(mainFolder)) {
    mainEquipment.forEach((equipment: any) => {
      // Equipment row
      rows.push({
        component: 'ResourceFolder',
        rowType: 'equipment', 
        height: LAYOUT.EQUIPMENT_ROW_HEIGHT,
        content: `🔧 ${equipment.name}`,
        isCollapsible: false,
        isExpanded: expandedEquipment.has(equipment.id)
      });
      
      // Project rows (if equipment is expanded AND not unfilled roles)
      if (!isUnfilledRolesSection && expandedEquipment.has(equipment.id)) {
        const usage = equipmentProjectUsage.get(equipment.id);
        if (usage && usage.projectNames.length > 0) {
          usage.projectNames.forEach((projectName: string) => {
            rows.push({
              component: 'ResourceFolder',
              rowType: 'project',
              height: LAYOUT.PROJECT_ROW_HEIGHT,
              content: `  📋 ${projectName}`,
              isCollapsible: false
            });
          });
        }
      }
    });
    
    // 3. Subfolders
    subFolders.forEach((subFolder: any) => {
      const subFolderKey = `${mainFolder}/${subFolder.name}`;
      
      // Subfolder header (CollapsibleTrigger)
      rows.push({
        component: 'ResourceFolder',
        rowType: 'subfolder',
        height: LAYOUT.SUBFOLDER_HEIGHT,
        content: `  📂 ${subFolder.name}`,
        isCollapsible: true,
        isExpanded: expandedGroups.has(subFolderKey)
      });
      
      // Subfolder equipment (if expanded)
      if (expandedGroups.has(subFolderKey)) {
        subFolder.equipment.forEach((equipment: any) => {
          rows.push({
            component: 'ResourceFolder',
            rowType: 'equipment',
            height: LAYOUT.EQUIPMENT_ROW_HEIGHT,
            content: `    🔧 ${equipment.name}`,
            isCollapsible: false,
            isExpanded: expandedEquipment.has(equipment.id)
          });
          
          // Subfolder project rows (if equipment expanded AND not unfilled roles)
          if (!isUnfilledRolesSection && expandedEquipment.has(equipment.id)) {
            const usage = equipmentProjectUsage.get(equipment.id);
            if (usage && usage.projectNames.length > 0) {
              usage.projectNames.forEach((projectName: string) => {
                rows.push({
                  component: 'ResourceFolder',
                  rowType: 'project',
                  height: LAYOUT.PROJECT_ROW_HEIGHT,
                  content: `      📋 ${projectName}`,
                  isCollapsible: false
                });
              });
            }
          }
        });
      }
    });
  }
  
  return rows;
}

/**
 * Analyze what rows TimelineSection would render
 */
export function analyzeTimelineRows(
  equipmentGroup: any,
  expandedGroups: Set<string>,
  expandedEquipment: Set<string>,
  equipmentProjectUsage: Map<string, any>,
  isUnfilledRolesSection: boolean = false
): RowAnalysis[] {
  const rows: RowAnalysis[] = [];
  const { mainFolder, equipment: mainEquipment, subFolders } = equipmentGroup;
  
  // 1. Main folder header (div, NOT CollapsibleTrigger)
  rows.push({
    component: 'Timeline',
    rowType: 'mainFolder',
    height: LAYOUT.MAIN_FOLDER_HEIGHT,
    content: `📁 ${mainFolder} (empty div)`,
    isCollapsible: false,
    isExpanded: expandedGroups.has(mainFolder)
  });
  
  // 2. Main equipment rows (if folder is expanded)  
  if (expandedGroups.has(mainFolder)) {
    mainEquipment.forEach((equipment: any) => {
      // Equipment timeline cells
      const equipmentHeight = isUnfilledRolesSection ? LAYOUT.PROJECT_ROW_HEIGHT : LAYOUT.PROJECT_ROW_HEIGHT;
      rows.push({
        component: 'Timeline',
        rowType: 'equipment',
        height: equipmentHeight,
        content: `🔧 ${equipment.name} (timeline cells)`,
        isCollapsible: false,
        isExpanded: expandedEquipment.has(equipment.id)
      });
      
      // Project timeline rows (if equipment expanded AND not unfilled roles)
      if (!isUnfilledRolesSection && expandedEquipment.has(equipment.id)) {
        const usage = equipmentProjectUsage.get(equipment.id);
        if (usage && usage.projectNames.length > 0) {
          usage.projectNames.forEach((projectName: string) => {
            rows.push({
              component: 'Timeline',
              rowType: 'project',
              height: LAYOUT.PROJECT_ROW_HEIGHT,
              content: `  📋 ${projectName} (ProjectRow)`,
              isCollapsible: false
            });
          });
        } else {
          // "No assignments" row
          rows.push({
            component: 'Timeline',
            rowType: 'empty',
            height: LAYOUT.PROJECT_ROW_HEIGHT / 2,
            content: `  📋 No project assignments`,
            isCollapsible: false
          });
        }
      }
    });
    
    // 3. Subfolders
    subFolders.forEach((subFolder: any) => {
      const subFolderKey = `${mainFolder}/${subFolder.name}`;
      
      // Subfolder header (div, NOT CollapsibleTrigger)
      rows.push({
        component: 'Timeline',
        rowType: 'subfolder',
        height: LAYOUT.SUBFOLDER_HEIGHT,
        content: `  📂 ${subFolder.name} (empty div)`,
        isCollapsible: false,
        isExpanded: expandedGroups.has(subFolderKey)
      });
      
      // Subfolder equipment (if expanded)
      if (expandedGroups.has(subFolderKey)) {
        subFolder.equipment.forEach((equipment: any) => {
          const equipmentHeight = isUnfilledRolesSection ? LAYOUT.PROJECT_ROW_HEIGHT : LAYOUT.EQUIPMENT_ROW_HEIGHT;
          rows.push({
            component: 'Timeline',
            rowType: 'equipment',
            height: equipmentHeight,
            content: `    🔧 ${equipment.name} (timeline cells)`,
            isCollapsible: false,
            isExpanded: expandedEquipment.has(equipment.id)
          });
          
          // Subfolder project rows (if equipment expanded AND not unfilled roles)
          if (!isUnfilledRolesSection && expandedEquipment.has(equipment.id)) {
            const usage = equipmentProjectUsage.get(equipment.id);
            if (usage && usage.projectNames.length > 0) {
              usage.projectNames.forEach((projectName: string) => {
                rows.push({
                  component: 'Timeline',
                  rowType: 'project',
                  height: LAYOUT.PROJECT_ROW_HEIGHT,
                  content: `      📋 ${projectName} (ProjectRow)`,
                  isCollapsible: false
                });
              });
            } else {
              // "No assignments" row
              rows.push({
                component: 'Timeline',
                rowType: 'empty',
                height: LAYOUT.PROJECT_ROW_HEIGHT / 2,
                content: `      📋 No project assignments`,
                isCollapsible: false
              });
            }
          }
        });
      }
    });
  }
  
  return rows;
}

/**
 * Compare row structures and find mismatches
 */
export function compareRowStructures(
  resourceRows: RowAnalysis[],
  timelineRows: RowAnalysis[]
): {
  isAligned: boolean;
  mismatches: string[];
  totalResourceHeight: number;
  totalTimelineHeight: number;
  resourceCount: number;
  timelineCount: number;
} {
  const mismatches: string[] = [];
  
  const totalResourceHeight = resourceRows.reduce((sum, row) => sum + row.height, 0);
  const totalTimelineHeight = timelineRows.reduce((sum, row) => sum + row.height, 0);
  
  // Check row count
  if (resourceRows.length !== timelineRows.length) {
    mismatches.push(`Row count mismatch: Resource=${resourceRows.length}, Timeline=${timelineRows.length}`);
  }
  
  // Check each row
  const maxRows = Math.max(resourceRows.length, timelineRows.length);
  for (let i = 0; i < maxRows; i++) {
    const resourceRow = resourceRows[i];
    const timelineRow = timelineRows[i];
    
    if (!resourceRow) {
      mismatches.push(`Timeline row ${i}: "${timelineRow.content}" has no corresponding Resource row`);
    } else if (!timelineRow) {
      mismatches.push(`Resource row ${i}: "${resourceRow.content}" has no corresponding Timeline row`);
    } else {
      // Compare row types
      if (resourceRow.rowType !== timelineRow.rowType) {
        mismatches.push(`Row ${i} type mismatch: Resource="${resourceRow.rowType}", Timeline="${timelineRow.rowType}"`);
      }
      
      // Compare heights
      if (resourceRow.height !== timelineRow.height) {
        mismatches.push(`Row ${i} height mismatch: Resource=${resourceRow.height}px, Timeline=${timelineRow.height}px`);
      }
      
      // Compare collapsible state
      if (resourceRow.isCollapsible !== timelineRow.isCollapsible) {
        mismatches.push(`Row ${i} collapsible mismatch: Resource=${resourceRow.isCollapsible}, Timeline=${timelineRow.isCollapsible}`);
      }
    }
  }
  
  return {
    isAligned: mismatches.length === 0,
    mismatches,
    totalResourceHeight,
    totalTimelineHeight,
    resourceCount: resourceRows.length,
    timelineCount: timelineRows.length
  };
}

/**
 * Debug component that can be used to log alignment issues
 */
export function debugAlignment(
  equipmentGroup: any,
  expandedGroups: Set<string>,
  expandedEquipment: Set<string>,
  equipmentProjectUsage: Map<string, any>,
  isUnfilledRolesSection: boolean = false
) {
  const resourceRows = analyzeResourceFolderRows(
    equipmentGroup, expandedGroups, expandedEquipment, equipmentProjectUsage, isUnfilledRolesSection
  );
  
  const timelineRows = analyzeTimelineRows(
    equipmentGroup, expandedGroups, expandedEquipment, equipmentProjectUsage, isUnfilledRolesSection  
  );
  
  const comparison = compareRowStructures(resourceRows, timelineRows);
  
  console.group(`🚨 ALIGNMENT DEBUG: ${equipmentGroup.mainFolder}`);
  console.log('📊 Resource Rows:', resourceRows);
  console.log('📊 Timeline Rows:', timelineRows);
  console.log('📊 Comparison:', comparison);
  
  if (!comparison.isAligned) {
    console.error('❌ MISALIGNMENT DETECTED:');
    comparison.mismatches.forEach(mismatch => console.error(`  - ${mismatch}`));
  } else {
    console.log('✅ Rows are properly aligned');
  }
  console.groupEnd();
  
  return comparison;
}

export default {
  analyzeResourceFolderRows,
  analyzeTimelineRows,
  compareRowStructures,
  debugAlignment
};