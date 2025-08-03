/**
 * Crew-specific data structures for Planner
 * 
 * Domain-specific types for crew scheduling and management
 * while using the same shared UI infrastructure
 */

// Base crew member information
export interface CrewMember {
  id: string;
  name: string;
  role: string; // e.g., "Sound Engineer", "Camera Operator", "Lighting Director"
  roles?: string[]; // Array of all assigned role names for filtering
  department: string; // e.g., "Sound", "Camera", "Lighting", "Production"
  level: 'junior' | 'mid' | 'senior' | 'lead' | 'supervisor';
  availability: 'available' | 'busy' | 'unavailable' | 'vacation';
  hourlyRate?: number;
  skills: string[]; // e.g., ["Pro Tools", "Live Sound", "Studio Recording"]
  certifications?: string[]; // e.g., ["OSHA", "Drone License", "First Aid"]
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  // Avatar support
  avatarUrl?: string; // URL to avatar image from Google Auth
}

// Crew assignment for a specific project/event
export interface CrewAssignment {
  id: string;
  crewMemberId: string;
  crewMemberName: string;
  role: string;
  department: string;
  projectName: string;
  eventName: string;
  eventId?: string;
  projectId?: string;
  date: string; // yyyy-MM-dd format
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  status: 'confirmed' | 'declined' | 'completed' | 'cancelled'; // Removed 'scheduled' - crew is either assigned or not
  notes?: string;
  isOvertime?: boolean;
  dailyRate?: number; // Override for this specific assignment
  eventType?: string; // Type of event (Studio, Live, Corporate, etc.)
  eventTypeColor?: string; // Color to display for this event type
  location?: string; // Event location
}

// Crew availability for a specific date
export interface CrewAvailability {
  crewMemberId: string;
  crewMemberName: string;
  date: string; // yyyy-MM-dd format
  department: string;
  role: string;
  assignments: CrewAssignment[];
  totalAssignments: number;
  isOverbooked: boolean; // If assigned to conflicting projects/times
  conflict?: CrewConflict;
  availability: 'available' | 'busy' | 'unavailable';
}

// Conflict detection for crew scheduling
export interface CrewConflict {
  crewMemberId: string;
  date: string;
  severity: 'warning' | 'critical' | 'resolved';
  type: 'time_overlap' | 'double_booking' | 'unavailable_scheduled';
  conflictingAssignments: CrewAssignment[];
  suggestedResolution?: string;
  autoResolvable: boolean;
}

// Crew organizational structure (departments/roles)
export interface CrewDepartment {
  name: string; // e.g., "Sound", "Camera", "Lighting"
  crewMembers: CrewMember[];
  roles: CrewRole[];
  isExpanded: boolean;
}

export interface CrewRole {
  name: string; // e.g., "Sound Engineer", "Camera Operator"
  mainFolder: string; // Department name for compatibility
  equipment: CrewMember[]; // Crew members in this role - using 'equipment' for compatibility
  isExpanded: boolean;
}

// Top-level crew grouping for display (compatible with shared components)
export interface CrewGroup {
  mainFolder: string; // Department name (e.g., "Sound", "Camera", "Lighting") - compatible with shared components
  equipment: CrewMember[]; // Direct department members - using 'equipment' name for compatibility
  subFolders: CrewRole[]; // Sub-roles within department - using 'subFolders' name for compatibility
  isExpanded: boolean;
  isUnfilledRolesSection?: boolean; // Special flag for unfilled roles section
}

// Project-specific crew assignments for expanded view
export interface CrewProjectAssignment {
  date: string;
  projectName: string;
  eventName: string;
  crewMemberId: string;
  role: string;
  startTime?: string;
  endTime?: string;
  status: CrewAssignment['status'];
}

// Expansion state tracking for crew UI
export interface CrewExpansionState {
  expandedDepartments: Set<string>; // department names
  expandedRoles: Set<string>; // role names like "Sound/Engineer"  
  expandedCrewMembers: Set<string>; // crew member IDs for project view
}

// Generic interfaces to make shared components work with both domains
export type ResourceGroup = CrewGroup; // Can be either crew or equipment group
export type ResourceMember = CrewMember; // Can be either crew member or equipment item
export type ResourceAssignment = CrewAssignment; // Can be either crew assignment or equipment booking

// Helper function to sort crew groups by department priority
// Custom order: Sonic City first, then Associates, then Freelancers, then other departments
export const DEPARTMENT_ORDER = [
  'Unfilled Roles',
  'Sonic City',
  'Associates', 
  'Freelancers',
  'Production',
  'Director', 
  'Camera',
  'Sound',
  'Lighting',
  'Grip',
  'Electric',
  'Art Department',
  'Wardrobe',
  'Makeup',
  'Post Production',
  'Other'
];

export function sortCrewGroups(groups: CrewGroup[], departmentOrder: string[]): CrewGroup[] {
  return groups.sort((a, b) => {
    const aIndex = departmentOrder.indexOf(a.mainFolder); // Fixed: use mainFolder for compatibility
    const bIndex = departmentOrder.indexOf(b.mainFolder); // Fixed: use mainFolder for compatibility
    
    // If not found in order, put at end alphabetically
    if (aIndex === -1 && bIndex === -1) return a.mainFolder.localeCompare(b.mainFolder);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
}