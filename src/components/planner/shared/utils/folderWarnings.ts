/**
 * Folder Warning Detection Utilities
 * 
 * Detects overbookings and empties at the folder and subfolder level
 * to show warning indicators on folder headers and timeline rows.
 */

import { EquipmentGroup } from '../types';
import { analyzeWarnings, extractEquipmentIssues } from './warningAnalysis';

export interface FolderWarning {
  hasOverbookings: boolean;
  hasEmpties: boolean;
  hasConflicts: boolean;
  overboookingCount: number;
  emptyCount: number;
  conflictCount: number;
}

export interface FolderWarnings {
  [folderPath: string]: FolderWarning;
}

/**
 * Analyzes all equipment in a folder for conflicts across the date range
 */
export function analyzeFolderWarnings(
  equipmentGroups: EquipmentGroup[],
  formattedDates: Array<{ dateStr: string }>,
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any
): FolderWarnings {
  const warnings: FolderWarnings = {};

  equipmentGroups.forEach(group => {
    const mainFolderPath = group.mainFolder;
    
    // Initialize main folder warning
    if (!warnings[mainFolderPath]) {
      warnings[mainFolderPath] = {
        hasOverbookings: false,
        hasEmpties: false,
        hasConflicts: false,
        overboookingCount: 0,
        emptyCount: 0,
        conflictCount: 0
      };
    }

    // Analyze main folder equipment
    group.equipment.forEach(equipment => {
      analyzeSingleEquipment(
        equipment,
        formattedDates,
        getBookingForEquipment,
        warnings[mainFolderPath]
      );
    });

    // Analyze subfolders
    group.subFolders?.forEach(subFolder => {
      const subFolderPath = `${mainFolderPath}/${subFolder.name}`;
      
      if (!warnings[subFolderPath]) {
        warnings[subFolderPath] = {
          hasOverbookings: false,
          hasEmpties: false,
          hasConflicts: false,
          overboookingCount: 0,
          emptyCount: 0,
          conflictCount: 0
        };
      }

      subFolder.equipment.forEach(equipment => {
        analyzeSingleEquipment(
          equipment,
          formattedDates,
          getBookingForEquipment,
          warnings[subFolderPath]
        );

        // Also roll up to main folder
        analyzeSingleEquipment(
          equipment,
          formattedDates,
          getBookingForEquipment,
          warnings[mainFolderPath]
        );
      });
    });
  });

  return warnings;
}

/**
 * Analyzes a single piece of equipment for conflicts
 */
function analyzeSingleEquipment(
  equipment: any,
  formattedDates: Array<{ dateStr: string }>,
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any,
  warning: FolderWarning
): void {
  formattedDates.forEach(({ dateStr }) => {
    const booking = getBookingForEquipment(equipment.id, dateStr);
    
    if (!booking) {
      // Empty - no bookings for this equipment on this date
      warning.hasEmpties = true;
      warning.emptyCount++;
    } else {
      // Check for overbookings
      if (booking.isOverbooked) {
        warning.hasOverbookings = true;
        warning.overboookingCount++;
      }
      
      // Check for conflicts
      if (booking.conflict && booking.conflict.severity !== 'resolved') {
        warning.hasConflicts = true;
        warning.conflictCount++;
      }
    }
  });
}

/**
 * Determines the visual indicator type for a folder
 */
export function getFolderWarningType(warning: FolderWarning): 'critical' | 'warning' | 'none' {
  if (warning.hasOverbookings || warning.hasConflicts) {
    return 'critical';
  }
  if (warning.hasEmpties) {
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
  
  if (warning.hasEmpties) {
    issues.push(`${warning.emptyCount} empty slot${warning.emptyCount !== 1 ? 's' : ''}`);
  }
  
  if (issues.length === 0) {
    return 'No issues';
  }
  
  return issues.join(', ');
}