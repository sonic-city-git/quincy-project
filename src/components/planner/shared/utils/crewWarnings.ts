/**
 * Crew Warning Detection Utilities
 * 
 * Detects double bookings and missing crew assignments at the folder (department)
 * and subfolder (role) level to show warning indicators.
 */

import { EquipmentGroup } from '../types';

export interface CrewWarning {
  hasDoubleBookings: boolean;
  hasMissingAssignments: boolean;
  doubleBookingCount: number;
  missingAssignmentCount: number;
}

export interface CrewWarnings {
  [folderPath: string]: CrewWarning;
}

/**
 * Analyzes all crew members in a department for scheduling issues
 */
export function analyzeCrewWarnings(
  departmentGroups: EquipmentGroup[],
  formattedDates: Array<{ dateStr: string }>,
  getBookingForCrew: (crewId: string, dateStr: string) => any
): CrewWarnings {
  const warnings: CrewWarnings = {};

  departmentGroups.forEach(department => {
    const departmentPath = department.mainFolder;
    
    // Initialize department warning
    if (!warnings[departmentPath]) {
      warnings[departmentPath] = {
        hasDoubleBookings: false,
        hasMissingAssignments: false,
        doubleBookingCount: 0,
        missingAssignmentCount: 0
      };
    }

    // Analyze department crew members
    department.equipment.forEach(crewMember => {
      analyzeSingleCrewMember(
        crewMember,
        formattedDates,
        getBookingForCrew,
        warnings[departmentPath]
      );
    });

    // Analyze roles (subfolders)
    department.subFolders?.forEach(role => {
      const rolePath = `${departmentPath}/${role.name}`;
      
      if (!warnings[rolePath]) {
        warnings[rolePath] = {
          hasDoubleBookings: false,
          hasMissingAssignments: false,
          doubleBookingCount: 0,
          missingAssignmentCount: 0
        };
      }

      role.equipment.forEach(crewMember => {
        analyzeSingleCrewMember(
          crewMember,
          formattedDates,
          getBookingForCrew,
          warnings[rolePath]
        );

        // Also roll up to department level
        analyzeSingleCrewMember(
          crewMember,
          formattedDates,
          getBookingForCrew,
          warnings[departmentPath]
        );
      });
    });
  });

  return warnings;
}

/**
 * Analyzes a single crew member for scheduling issues
 */
function analyzeSingleCrewMember(
  crewMember: any,
  formattedDates: Array<{ dateStr: string }>,
  getBookingForCrew: (crewId: string, dateStr: string) => any,
  warning: CrewWarning
): void {
  formattedDates.forEach(({ dateStr }) => {
    const booking = getBookingForCrew(crewMember.id, dateStr);
    
    if (!booking) {
      // No bookings for this date - this is normal, not a warning
      return;
    }

    // Check for double bookings (multiple events on same day)
    if (booking.conflict && booking.conflict.severity !== 'resolved') {
      warning.hasDoubleBookings = true;
      warning.doubleBookingCount++;
    }
    
    // Check for missing assignments (event requires role but no crew assigned)
    if (booking.isMissingAssignment) {
      warning.hasMissingAssignments = true;
      warning.missingAssignmentCount++;
    }
  });
}

/**
 * Determines the visual indicator type for a department/role
 */
export function getCrewWarningType(warning: CrewWarning): 'critical' | 'warning' | 'none' {
  if (warning.hasDoubleBookings) {
    return 'critical';  // Double bookings are critical issues
  }
  if (warning.hasMissingAssignments) {
    return 'warning';   // Missing assignments are warnings
  }
  return 'none';
}

/**
 * Gets a human-readable description of crew scheduling issues
 */
export function getCrewWarningDescription(warning: CrewWarning): string {
  const issues = [];
  
  if (warning.hasDoubleBookings) {
    issues.push(`${warning.doubleBookingCount} double booking${warning.doubleBookingCount !== 1 ? 's' : ''}`);
  }
  
  if (warning.hasMissingAssignments) {
    issues.push(`${warning.missingAssignmentCount} missing assignment${warning.missingAssignmentCount !== 1 ? 's' : ''}`);
  }
  
  if (issues.length === 0) {
    return 'No scheduling issues';
  }
  
  return issues.join(', ');
}