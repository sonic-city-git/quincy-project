import { format } from 'date-fns';

/**
 * Simple, unified tooltip system for planner
 * Handles both crew and equipment tooltips with clean formatting
 */

// Main interface - pass simple information and get formatted tooltip
export interface PlannerTooltipData {
  resourceName: string; // Person or equipment name
  date: string;
  
  // For crew day cells (multiple assignments)
  assignments?: Array<{
    eventName: string;
    projectName: string;
    role: string;
    location?: string;
  }>;
  isAvailable?: boolean;
  isConflict?: boolean;
  
  // For equipment
  stock?: number;
  used?: number;
  available?: number;
  
  // For project row badges (single assignment)
  eventName?: string;
  projectName?: string;
  role?: string;
  location?: string;
}

// Legacy interfaces (backward compatibility)
export interface CrewTooltipData {
  crewMemberName: string;
  date: string;
  assignments?: Array<{
    eventName: string;
    projectName: string;
    role: string;
    location?: string;
    eventType?: string;
  }>;
  isAvailable?: boolean;
  isConflict?: boolean;
}

export interface ProjectRowTooltipData {
  crewMemberName: string;
  date: string;
  eventName: string;
  projectName: string;
  role: string;
  location?: string;
  eventType?: string;
}

/**
 * Unified simple tooltip formatter for planner
 */
export function formatPlannerTooltip(data: PlannerTooltipData): string {
  const { resourceName, date } = data;
  
  // Format the date nicely
  const formattedDate = format(new Date(date), 'EEE, MMM d');
  
  let tooltip = `${resourceName}\n${formattedDate}`;
  
  // Handle crew assignments (multiple)
  if (data.assignments) {
    if (data.assignments.length === 0 || data.isAvailable) {
      tooltip += `\nAvailable`;
      return tooltip;
    }
    
    if (data.isConflict && data.assignments.length > 1) {
      tooltip += `\nCONFLICT: Multiple assignments`;
    }
    
    data.assignments.forEach((assignment) => {
      tooltip += `\n\n${assignment.eventName}`;
      tooltip += `\nRole: ${assignment.role}`;
      tooltip += `\nProject: ${assignment.projectName}`;
      if (assignment.location) {
        tooltip += `\nLocation: ${assignment.location}`;
      }
    });
    
    return tooltip;
  }
  
  // Handle single assignment (project row)
  if (data.eventName && data.role) {
    tooltip += `\n\nRole: ${data.role}`;
    tooltip += `\nEvent: ${data.eventName}`;
    if (data.projectName) {
      tooltip += `\nProject: ${data.projectName}`;
    }
    if (data.location) {
      tooltip += `\nLocation: ${data.location}`;
    }
    
    return tooltip;
  }
  
  // Handle equipment
  if (data.stock !== undefined || data.used !== undefined || data.available !== undefined) {
    if (data.stock !== undefined) {
      tooltip += `\nStock: ${data.stock}`;
    }
    if (data.used !== undefined) {
      tooltip += `\nUsed: ${data.used}`;
    }
    if (data.available !== undefined) {
      tooltip += `\nAvailable: ${data.available}`;
      if (data.available < 0) {
        tooltip += ` (OVERBOOKED)`;
      }
    }
    
    return tooltip;
  }
  
  return tooltip;
}

// Legacy functions kept for backward compatibility if needed elsewhere
export function formatCrewDayTooltip(data: CrewTooltipData): string {
  return formatPlannerTooltip({
    resourceName: data.crewMemberName,
    date: data.date,
    assignments: data.assignments,
    isAvailable: data.isAvailable,
    isConflict: data.isConflict
  });
}

export function formatProjectRowTooltip(data: ProjectRowTooltipData): string {
  return formatPlannerTooltip({
    resourceName: data.crewMemberName,
    date: data.date,
    eventName: data.eventName,
    projectName: data.projectName,
    role: data.role,
    location: data.location
  });
}

export function formatEquipmentTooltip(
  equipmentName: string,
  stock?: number,
  used?: number,
  available?: number
): string {
  return formatPlannerTooltip({
    resourceName: equipmentName,
    date: new Date().toISOString(), // Default date for equipment
    stock,
    used,
    available
  });
}