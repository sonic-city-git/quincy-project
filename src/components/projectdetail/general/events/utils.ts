/**
 * 🎯 EVENT UTILITIES
 * 
 * Centralized utility functions for event handling
 * Consolidates: eventGroups.ts and other scattered utils
 */

import { CalendarEvent } from '@/types/events';
import { isPast } from 'date-fns';

/**
 * Event grouping by status
 */
export interface GroupedEvents {
  proposed: CalendarEvent[];
  confirmed: CalendarEvent[];
  ready: CalendarEvent[];
  cancelled: CalendarEvent[];
  doneAndDusted: CalendarEvent[];
}

/**
 * Sort events by date (earliest first)
 */
const sortEventsByDate = (events: CalendarEvent[]) => {
  return [...events].sort((a, b) => {
    // Handle null dates - put null dates at the end
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
};

/**
 * Group events by status with automatic "done and dusted" detection
 */
export function groupEventsByStatus(events: CalendarEvent[]): GroupedEvents {
  const groups = events.reduce(
    (groups, event) => {
      // Skip null/undefined events or events with missing required fields
      if (!event || !event.date || !event.status) {
        return groups;
      }
      
      // Check if event should go to "Done and Dusted"
      const isInPast = isPast(new Date(event.date));
      const isDoneAndDusted = 
        event.status === "invoiced" || 
        (event.status === "cancelled" && isInPast);

      if (isDoneAndDusted) {
        groups.doneAndDusted.push(event);
      } else {
        // Regular grouping for other events
        switch (event.status) {
          case "proposed":
            groups.proposed.push(event);
            break;
          case "confirmed":
            groups.confirmed.push(event);
            break;
          case "invoice ready":
            groups.ready.push(event);
            break;
          case "cancelled":
            groups.cancelled.push(event);
            break;
        }
      }
      return groups;
    },
    {
      proposed: [],
      confirmed: [],
      ready: [],
      cancelled: [],
      doneAndDusted: []
    } as GroupedEvents
  );

  // Sort each group by date
  return {
    proposed: sortEventsByDate(groups.proposed),
    confirmed: sortEventsByDate(groups.confirmed),
    ready: sortEventsByDate(groups.ready),
    cancelled: sortEventsByDate(groups.cancelled),
    doneAndDusted: sortEventsByDate(groups.doneAndDusted)
  };
}

/**
 * Event status utilities
 */
export const eventStatus = {
  isEditable: (status: CalendarEvent['status']) => 
    !['cancelled', 'invoice ready', 'invoiced'].includes(status),
  
  isPast: (event: CalendarEvent) => 
    event.date ? isPast(new Date(event.date)) : false,
  
  isDoneAndDusted: (event: CalendarEvent) => 
    event.status === "invoiced" || 
    (event.status === "cancelled" && eventStatus.isPast(event)),
  
  canSync: (event: CalendarEvent) =>
    event.type?.needs_equipment || event.type?.needs_crew,
  
  needsEquipment: (event: CalendarEvent) => 
    event.type?.needs_equipment === true,
  
  needsCrew: (event: CalendarEvent) => 
    event.type?.needs_crew === true
} as const;

/**
 * Event formatting utilities
 */
export const eventFormatting = {
  getDisplayDate: (event: CalendarEvent) => {
    if (!event.date) return 'No date';
    return new Date(event.date).toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  },
  
  getDisplayTime: (event: CalendarEvent) => {
    if (!event.date) return '';
    return new Date(event.date).toLocaleTimeString('no-NO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  
  getShortTitle: (event: CalendarEvent, maxLength: number = 30) => {
    if (!event.name) return 'Untitled Event';
    return event.name.length > maxLength 
      ? `${event.name.substring(0, maxLength)}...` 
      : event.name;
  }
} as const;

/**
 * Event validation utilities
 */
export const eventValidation = {
  isValid: (event: CalendarEvent) =>
    event && event.id && event.name && event.date && event.status,
  
  hasRequiredFields: (event: CalendarEvent) =>
    Boolean(event?.name && event?.date && event?.type),
  
  isConflictable: (event: CalendarEvent) =>
    eventStatus.needsCrew(event) && !eventStatus.isDoneAndDusted(event)
} as const;

/**
 * Price calculation utilities
 */
export const eventPricing = {
  getTotalPrice: (event: CalendarEvent) =>
    (event.equipment_price || 0) + (event.crew_price || 0),
  
  formatPrice: (amount: number) => 
    new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount),
  
  calculateSectionTotal: (events: CalendarEvent[], field: 'equipment_price' | 'crew_price' | 'total_price') => 
    events.reduce((sum, event) => {
      if (field === 'total_price') {
        return sum + eventPricing.getTotalPrice(event);
      }
      return sum + (event[field] || 0);
    }, 0)
} as const;

/**
 * Main export with all utilities
 */
export const eventUtils = {
  groupEventsByStatus,
  status: eventStatus,
  formatting: eventFormatting,
  validation: eventValidation,
  pricing: eventPricing,
  sort: {
    byDate: sortEventsByDate,
    byStatus: (events: CalendarEvent[]) => 
      events.sort((a, b) => a.status.localeCompare(b.status)),
    byName: (events: CalendarEvent[]) => 
      events.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }
} as const;