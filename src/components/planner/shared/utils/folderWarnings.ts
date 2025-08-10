/**
 * FOLDER WARNING DETECTION - EQUIPMENT STOCK ENGINE VERSION
 * 
 * ✅ COMPLETELY REDESIGNED FOR EQUIPMENT STOCK ENGINE
 * 
 * Detects overbookings and conflicts at the folder and subfolder level
 * using the ONE EQUIPMENT ENGINE with virtual stock calculations.
 * 
 * Benefits:
 * - Virtual stock awareness (subrentals resolve conflicts)
 * - Real-time conflict resolution indicators
 * - Optimized batch calculations
 * - Folder-level conflict aggregation
 * - Smart severity analysis
 */

import { useEquipmentStockEngine } from '@/hooks/useEquipmentStockEngine';
import { ConflictAnalysis } from '@/types/stock';
import { EquipmentGroup } from '../types';

export interface FolderWarning {
  hasOverbookings: boolean;
  hasEmpties: boolean;
  hasConflicts: boolean;
  overboookingCount: number;
  emptyCount: number;
  conflictCount: number;
  // NEW: Virtual stock awareness
  virtualStockResolved: number; // Conflicts resolved by virtual stock
  severity: 'low' | 'medium' | 'high';
  affectedEquipment: string[];
  suggestedActions: string[];
}

export interface FolderWarnings {
  [folderPath: string]: FolderWarning;
}

/**
 * Hook to analyze folder warnings using unified stock engine
 */
export function useFolderWarnings(
  equipmentGroups: EquipmentGroup[],
  startDate: string,
  endDate: string,
  selectedOwner?: string
): FolderWarnings {
  
  // Get all equipment IDs for batch processing
  const allEquipmentIds = equipmentGroups.flatMap(group => [
    ...group.equipment.map(e => e.id),
    ...(group.subFolders?.flatMap(sf => sf.equipment.map(e => e.id)) || [])
  ]);

  // Get conflicts from EQUIPMENT ENGINE
  const stockEngine = useEquipmentStockEngine();

  // Filter conflicts to our equipment and date range
  const relevantConflicts = stockEngine.getConflicts({
    equipmentIds: allEquipmentIds,
    dateRange: { start: startDate, end: endDate }
  });

  if (stockEngine.isLoading) {
    return {};
  }

  return analyzeFolderWarnings(equipmentGroups, relevantConflicts);
}

/**
 * Analyzes all equipment in folders for conflicts using stock engine results
 */
export function analyzeFolderWarnings(
  equipmentGroups: EquipmentGroup[],
  conflicts: ConflictAnalysis[]
): FolderWarnings {
  const warnings: FolderWarnings = {};

  // Create conflict lookup by equipment ID
  const conflictsByEquipment = new Map<string, ConflictAnalysis[]>();
  conflicts.forEach(conflict => {
    const existing = conflictsByEquipment.get(conflict.equipmentId) || [];
    existing.push(conflict);
    conflictsByEquipment.set(conflict.equipmentId, existing);
  });

  equipmentGroups.forEach(group => {
    const mainFolderPath = group.mainFolder;
    
    // Initialize main folder warning
    warnings[mainFolderPath] = createEmptyFolderWarning();

    // Analyze main folder equipment
    group.equipment.forEach(equipment => {
      const equipmentConflicts = conflictsByEquipment.get(equipment.id) || [];
      aggregateEquipmentWarnings(equipmentConflicts, warnings[mainFolderPath]);
    });

    // Analyze subfolders
    group.subFolders?.forEach(subFolder => {
      const subFolderPath = `${mainFolderPath}/${subFolder.name}`;
      warnings[subFolderPath] = createEmptyFolderWarning();

      subFolder.equipment.forEach(equipment => {
        const equipmentConflicts = conflictsByEquipment.get(equipment.id) || [];
        
        // Add to subfolder
        aggregateEquipmentWarnings(equipmentConflicts, warnings[subFolderPath]);
        
        // Also roll up to main folder
        aggregateEquipmentWarnings(equipmentConflicts, warnings[mainFolderPath]);
      });
    });

    // Calculate final metrics for main folder
    finalizeFolderWarning(warnings[mainFolderPath]);
    
    // Calculate final metrics for subfolders
    group.subFolders?.forEach(subFolder => {
      const subFolderPath = `${mainFolderPath}/${subFolder.name}`;
      finalizeFolderWarning(warnings[subFolderPath]);
    });
  });

  return warnings;
}

/**
 * Create empty folder warning structure
 */
function createEmptyFolderWarning(): FolderWarning {
  return {
    hasOverbookings: false,
    hasEmpties: false,
    hasConflicts: false,
    overboookingCount: 0,
    emptyCount: 0,
    conflictCount: 0,
    virtualStockResolved: 0,
    severity: 'low',
    affectedEquipment: [],
    suggestedActions: []
  };
}

/**
 * Aggregate conflicts for a single piece of equipment into folder warning
 */
function aggregateEquipmentWarnings(
  conflicts: ConflictAnalysis[],
  warning: FolderWarning
): void {
  
  conflicts.forEach(conflict => {
    // Track conflicts
    warning.hasConflicts = true;
    warning.conflictCount++;
    
    // Track overbookings (after virtual stock calculations!)
    if (conflict.conflict.deficit > 0) {
      warning.hasOverbookings = true;
      warning.overboookingCount += conflict.conflict.deficit;
    }
    
    // Track virtual stock resolutions
    const virtualAdditions = conflict.stockBreakdown.virtualAdditions;
    if (virtualAdditions > 0) {
      warning.virtualStockResolved += virtualAdditions;
    }
    
    // Track affected equipment
    if (!warning.affectedEquipment.includes(conflict.equipmentName)) {
      warning.affectedEquipment.push(conflict.equipmentName);
    }
    
    // Aggregate suggested actions
    conflict.conflict.suggestedActions.forEach(action => {
      if (!warning.suggestedActions.includes(action.type)) {
        warning.suggestedActions.push(action.type);
      }
    });
  });
}

/**
 * Finalize folder warning calculations
 */
function finalizeFolderWarning(warning: FolderWarning): void {
  // Determine overall severity
  if (warning.overboookingCount > 5) {
    warning.severity = 'high';
  } else if (warning.overboookingCount > 0) {
    warning.severity = 'medium';
  } else {
    warning.severity = 'low';
  }
}

/**
 * Determines the visual indicator type for a folder
 */
export function getFolderWarningType(warning: FolderWarning): 'critical' | 'warning' | 'resolved' | 'none' {
  if (warning.hasOverbookings) {
    return 'critical';
  }
  if (warning.hasConflicts && warning.virtualStockResolved > 0) {
    return 'resolved'; // NEW: Conflicts resolved by virtual stock
  }
  if (warning.hasConflicts) {
    return 'warning';
  }
  return 'none';
}

/**
 * Gets a human-readable description of folder issues
 */
export function getFolderWarningDescription(warning: FolderWarning): string {
  const issues = [];
  
  if (warning.hasOverbookings) {
    issues.push(`${warning.overboookingCount} overbooking${warning.overboookingCount !== 1 ? 's' : ''}`);
  }
  
  if (warning.hasConflicts) {
    issues.push(`${warning.conflictCount} conflict${warning.conflictCount !== 1 ? 's' : ''}`);
  }
  
  // NEW: Show virtual stock resolutions
  if (warning.virtualStockResolved > 0) {
    issues.push(`${warning.virtualStockResolved} resolved by subrentals`);
  }
  
  if (warning.hasEmpties) {
    issues.push(`${warning.emptyCount} empty slot${warning.emptyCount !== 1 ? 's' : ''}`);
  }
  
  if (issues.length === 0) {
    return 'No issues detected';
  }
  
  return issues.join(', ');
}