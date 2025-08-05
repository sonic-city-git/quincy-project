/**
 * 🎯 EVENT COMPONENT TYPES
 * 
 * Centralized type definitions for better maintainability
 */

import { CalendarEvent, EventType } from "@/types/events";

// Base event component props
export interface BaseEventProps {
  event: CalendarEvent;
  isEditingDisabled?: boolean;
  className?: string;
}

// Event list props
export interface EventListProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: (event: CalendarEvent) => void;
  className?: string;
}

// Event section props
export interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  eventType?: EventType;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
  hideHeader?: boolean;
  className?: string;
}

// Event card props
export interface EventCardProps extends BaseEventProps {
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
  sectionTitle?: string;
  showFullActions?: boolean;
}

// Equipment sync status
export interface EquipmentSyncStatus {
  isSynced: boolean;
  isChecking: boolean;
  hasProjectEquipment: boolean;
  canSync: boolean;
}

// Crew sync status
export interface CrewSyncStatus {
  isFullySynced: boolean;
  hasConflicts: boolean;
  hasProjectRoles: boolean;
  assignedCount: number;
  totalCount: number;
  conflictCount: number;
}

// Section sync aggregation
export interface SectionSyncStatus {
  equipment: 'synced' | 'not-synced' | 'no-equipment' | 'syncing';
  crew: 'synced' | 'partial' | 'conflicts' | 'not-synced' | 'no-crew';
  hasActions: boolean;
}

// Event actions
export interface EventActionHandlers {
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit?: (event: CalendarEvent) => void;
  onEquipmentSync?: (eventId: string) => void;
  onCrewSync?: (eventId: string) => void;
  onDuplicate?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}