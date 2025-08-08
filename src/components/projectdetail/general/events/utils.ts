/**
 * ⚠️ DEPRECATED: EVENT UTILITIES
 * 
 * This file is deprecated. Use the new unified system instead:
 * - Event status operations: statusUtils from @/constants/eventStatus
 * - Sync operations: useUnifiedEventSync from @/hooks/useUnifiedEventSync
 * 
 * @deprecated Use statusUtils from @/constants/eventStatus
 */

import { CalendarEvent } from '@/types/events';
import { isPast } from 'date-fns';
import { statusUtils } from '@/constants/eventStatus';

console.warn('⚠️ DEPRECATED: utils.ts is deprecated. Use statusUtils from @/constants/eventStatus instead');

/**
 * @deprecated Use statusUtils.groupByStatus instead
 */
export interface GroupedEvents {
  proposed: CalendarEvent[];
  confirmed: CalendarEvent[];
  ready: CalendarEvent[];
  cancelled: CalendarEvent[];
  doneAndDusted: CalendarEvent[];
}

/**
 * @deprecated Use statusUtils.sortByStatus instead
 */
const sortEventsByDate = (events: CalendarEvent[]) => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * @deprecated Use statusUtils.groupByStatus instead
 */
export function groupEventsByStatus(events: CalendarEvent[]): GroupedEvents {
  console.warn('⚠️ DEPRECATED: Use statusUtils.groupByStatus from @/constants/eventStatus instead');
  
  // Delegate to new system
  const grouped = statusUtils.groupByStatus(events);
  
  // Map to old interface for backward compatibility
  return {
    proposed: grouped.proposed,
    confirmed: grouped.confirmed,
    ready: grouped.ready,
    cancelled: grouped.cancelled,
    doneAndDusted: grouped.doneAndDusted
  };
}

/**
 * @deprecated Use statusUtils from @/constants/eventStatus instead
 */
export const eventStatus = {
  isEditable: (status: CalendarEvent['status']) => {
    console.warn('⚠️ DEPRECATED: Use statusUtils.canEdit from @/constants/eventStatus instead');
    return statusUtils.canEdit({ status } as CalendarEvent);
  },
  
  isPast: (event: CalendarEvent) => 
    event.date ? isPast(new Date(event.date)) : false,
  
  isDoneAndDusted: (event: CalendarEvent) => {
    console.warn('⚠️ DEPRECATED: Use statusUtils.isDoneAndDusted from @/constants/eventStatus instead');
    return statusUtils.isDoneAndDusted(event);
  },
  
  canSync: (event: CalendarEvent) =>
    event.type?.needs_equipment || event.type?.needs_crew,
  
  needsEquipment: (event: CalendarEvent) => 
    event.type?.needs_equipment === true,
  
  needsCrew: (event: CalendarEvent) => 
    event.type?.needs_crew === true
} as const;

/**
 * @deprecated Use statusUtils from @/constants/eventStatus instead
 */
export const eventFormatting = {
  getDateLabel: (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: eventDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
} as const;

/**
 * Consolidated event utilities - backward compatibility export
 * @deprecated Import specific functions from @/constants/eventStatus instead
 */
export const eventUtils = {
  groupEventsByStatus,
  ...eventStatus,
  ...eventFormatting
} as const;