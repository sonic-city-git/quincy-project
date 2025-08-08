/**
 * 🎯 UNIFIED EVENT SYNC TYPES
 * 
 * Consolidated type definitions for the unified sync system.
 * Replaces scattered interfaces across multiple files.
 */

import { CalendarEvent } from './events';

// Core sync data interfaces
export interface EquipmentSyncData {
  synced: boolean;
  hasProjectEquipment: boolean;
  differences: EquipmentDifference;
  canSync: boolean;
}

export interface CrewSyncData {
  synced: boolean;
  hasProjectRoles: boolean;
  roles: CrewRole[];
  conflicts: boolean;
  assignedCount: number;
  totalCount: number;
}

export interface EventSyncStatus {
  canEdit: boolean;
  isLocked: boolean;
  needsAttention: boolean;
}

// Equipment-related types
export interface EquipmentItem {
  id: string;
  quantity: number;
  equipment: {
    name: string;
    code: string | null;
  };
  group: {
    name: string;
  } | null;
}

export interface EquipmentDifference {
  added: EquipmentItem[];
  removed: EquipmentItem[];
  changed: {
    item: EquipmentItem;
    oldQuantity: number;
    newQuantity: number;
  }[];
}

// Crew-related types
export interface CrewRole {
  id: string;
  name: string;
  color: string;
  assigned: boolean;
  crewMember?: {
    id: string;
    name: string;
    email: string;
  };
}

// Unified data structure
export interface UnifiedSyncData {
  equipment: EquipmentSyncData;
  crew: CrewSyncData;
  status: EventSyncStatus;
}

// Action interfaces
export interface SyncActions {
  syncEquipment: () => Promise<void>;
  syncCrew: () => Promise<void>;
  syncAll: () => Promise<void>;
  fetchEquipmentDifferences: () => Promise<EquipmentDifference>;
}

export interface BulkSyncActions {
  syncEquipment: () => Promise<void>;
  syncCrew: () => Promise<void>;
  syncAll: () => Promise<void>;
  isSyncing: boolean;
}

// Hook return types
export interface UnifiedEventSyncResult {
  data: UnifiedSyncData;
  actions: SyncActions;
  isLoading: boolean;
  isSyncing: boolean;
}

// Legacy compatibility types (deprecated)
/**
 * @deprecated Use EquipmentSyncData instead
 */
export interface EquipmentSyncStatus {
  isSynced: boolean;
  isChecking: boolean;
  hasProjectEquipment: boolean;
  canSync: boolean;
}

/**
 * @deprecated Use CrewSyncData instead
 */
export interface CrewSyncStatus {
  isFullySynced: boolean;
  hasConflicts: boolean;
  hasProjectRoles: boolean;
  assignedCount: number;
  totalCount: number;
  conflictCount: number;
}

/**
 * @deprecated Use UnifiedSyncData instead
 */
export interface SectionSyncStatus {
  equipment: 'synced' | 'not-synced' | 'no-equipment' | 'syncing';
  crew: 'synced' | 'partial' | 'conflicts' | 'not-synced' | 'no-crew';
  hasActions: boolean;
}

// Event action handlers (consolidated)
export interface EventActionHandlers {
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
  onEquipmentSync?: (eventId: string) => void;
  onCrewSync?: (eventId: string) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}