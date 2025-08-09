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

/**
 * @deprecated These types have been moved to @/types/eventSync
 * Import from there instead for the unified type system
 */
import { 
  EquipmentSyncStatus,
  CrewSyncStatus, 
  SectionSyncStatus,
  EventActionHandlers
} from '@/types/eventSync';

export { 
  EquipmentSyncStatus,
  CrewSyncStatus, 
  SectionSyncStatus,
  EventActionHandlers
};