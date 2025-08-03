/**
 * CONSOLIDATED: Crew Types - Eliminates CrewRole duplication
 * 
 * Unified crew-related types that serve both database and planner use cases
 * Replaces duplicated CrewRole interfaces across the codebase
 */

import { BaseEntity } from './shared';

// Unified CrewRole that serves both database and planner contexts
export interface CrewRole extends BaseEntity {
  name: string;
  color: string;
  
  // Optional planner-specific properties (when used in planner context)
  mainFolder?: string;      // Department name for compatibility
  equipment?: CrewMember[]; // Crew members in this role (using 'equipment' for compatibility)
  isExpanded?: boolean;
}

// Enhanced CrewMember that supports both simple and complex use cases
export interface CrewMember extends BaseEntity {
  name: string;
  email: string | null;
  phone: string | null;
  folder_id: string | null;
  folderName?: string | null;
  roles?: string[];
  avatar_url?: string;
  
  // Optional planner-specific properties
  role?: string;            // Primary role name
  department?: string;      // e.g., "Sound", "Camera", "Lighting"
  level?: 'junior' | 'mid' | 'senior' | 'lead' | 'supervisor';
  availability?: 'available' | 'busy' | 'unavailable' | 'vacation';
  hourlyRate?: number;
  skills?: string[];
  certifications?: string[];
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  avatarUrl?: string;       // Alternative naming for planner
}

// Type guards for different use cases
export function isDatabaseCrewRole(role: CrewRole): role is Required<Pick<CrewRole, 'id' | 'name' | 'color' | 'created_at'>> {
  return !!(role.id && role.name && role.color && role.created_at);
}

export function isPlannerCrewRole(role: CrewRole): role is CrewRole & { mainFolder: string; equipment: CrewMember[] } {
  return !!(role.mainFolder && role.equipment);
}

// Legacy type aliases for backward compatibility
export type DatabaseCrewRole = Required<Pick<CrewRole, 'id' | 'name' | 'color' | 'created_at'>>;
export type PlannerCrewRole = CrewRole & { mainFolder: string; equipment: CrewMember[]; isExpanded: boolean };

// Transformation utilities
export function toDatabaseCrewRole(role: CrewRole): DatabaseCrewRole {
  return {
    id: role.id,
    name: role.name,
    color: role.color,
    created_at: role.created_at
  };
}

export function toPlannerCrewRole(role: CrewRole, members: CrewMember[] = [], expanded = false): PlannerCrewRole {
  return {
    ...role,
    mainFolder: role.mainFolder || role.name,
    equipment: members,
    isExpanded: expanded
  };
}