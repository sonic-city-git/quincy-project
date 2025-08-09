/**
 * 🎯 UNIFIED EVENT STATUS SYSTEM
 * 
 * Single source of truth for all event status patterns, colors, and behaviors.
 * Replaces scattered STATUS_CONFIG objects across EventCard, EventStatus, EventGrid.
 * 
 * Features:
 * - Consistent status patterns across all components
 * - Design system integration
 * - Status transition rules
 * - Icon and color mappings
 */

import { 
  CheckCircle, 
  Clock, 
  Send, 
  XCircle, 
  AlertTriangle,
  LucideIcon 
} from 'lucide-react';
import { STATUS_PATTERNS } from '@/design-system';
import { CalendarEvent } from '@/types/events';

export type EventStatus = 'proposed' | 'confirmed' | 'invoice ready' | 'cancelled' | 'invoiced';

export interface StatusConfig {
  icon: LucideIcon;
  label: string;
  description: string;
  pattern: typeof STATUS_PATTERNS.warning; // Design system pattern
  badgeStyle: string; // For event type badges
  canEdit: boolean;
  canDelete: boolean;
  canInvoice: boolean;
  sortOrder: number;
}

/**
 * UNIFIED STATUS CONFIGURATION
 * Single source of truth for all status-related styling and behavior
 */
export const EVENT_STATUS_CONFIG: Record<EventStatus, StatusConfig> = {
  proposed: {
    icon: Clock,
    label: 'Proposed',
    description: 'Waiting for confirmation',
    pattern: STATUS_PATTERNS.warning,
    badgeStyle: 'bg-yellow-500/20 text-foreground border border-yellow-500/30',
    canEdit: true,
    canDelete: true,
    canInvoice: false,
    sortOrder: 1
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    description: 'Ready for production',
    pattern: STATUS_PATTERNS.success,
    badgeStyle: 'bg-green-500/20 text-foreground border border-green-500/30',
    canEdit: true,
    canDelete: true,
    canInvoice: true,
    sortOrder: 2
  },
  'invoice ready': {
    icon: Send,
    label: 'Invoice Ready',
    description: 'Ready to invoice',
    pattern: STATUS_PATTERNS.info,
    badgeStyle: 'bg-blue-500/20 text-foreground border border-blue-500/30',
    canEdit: false,
    canDelete: false,
    canInvoice: true,
    sortOrder: 3
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    description: 'Event cancelled',
    pattern: STATUS_PATTERNS.critical,
    badgeStyle: 'bg-red-500/20 text-foreground border border-red-500/30',
    canEdit: false,
    canDelete: false,
    canInvoice: false,
    sortOrder: 4
  },
  invoiced: {
    icon: CheckCircle,
    label: 'Invoiced',
    description: 'Completed and invoiced',
    pattern: STATUS_PATTERNS.operational,
    badgeStyle: 'bg-gray-500/20 text-foreground border border-gray-500/30',
    canEdit: false,
    canDelete: false,
    canInvoice: false,
    sortOrder: 5
  }
} as const;

/**
 * STATUS UTILITIES
 * Centralized business logic for status operations
 */
export const statusUtils = {
  /**
   * Get status configuration
   */
  getConfig: (status: EventStatus): StatusConfig => {
    return EVENT_STATUS_CONFIG[status] || EVENT_STATUS_CONFIG.proposed;
  },

  /**
   * Check if event can be edited
   */
  canEdit: (event: CalendarEvent): boolean => {
    const config = EVENT_STATUS_CONFIG[event.status as EventStatus];
    return config?.canEdit ?? false;
  },

  /**
   * Check if event can be deleted
   */
  canDelete: (event: CalendarEvent): boolean => {
    const config = EVENT_STATUS_CONFIG[event.status as EventStatus];
    return config?.canDelete ?? false;
  },

  /**
   * Check if event can be invoiced
   */
  canInvoice: (event: CalendarEvent): boolean => {
    const config = EVENT_STATUS_CONFIG[event.status as EventStatus];
    return config?.canInvoice ?? false;
  },

  /**
   * Get valid status transitions for current status
   */
  getValidTransitions: (currentStatus: EventStatus): EventStatus[] => {
    switch (currentStatus) {
      case 'proposed':
        return ['confirmed', 'cancelled'];
      case 'confirmed':
        return ['invoice ready', 'cancelled'];
      case 'invoice ready':
        return ['invoiced', 'cancelled'];
      case 'cancelled':
        return []; // No transitions from cancelled
      case 'invoiced':
        return []; // No transitions from invoiced
      default:
        return [];
    }
  },

  /**
   * Check if status transition is valid
   */
  canTransitionTo: (from: EventStatus, to: EventStatus): boolean => {
    const validTransitions = statusUtils.getValidTransitions(from);
    return validTransitions.includes(to);
  },

  /**
   * Get status pattern for styling
   */
  getPattern: (status: EventStatus) => {
    return EVENT_STATUS_CONFIG[status]?.pattern || STATUS_PATTERNS.warning;
  },

  /**
   * Get badge styling for event types
   */
  getBadgeStyle: (status: EventStatus): string => {
    return EVENT_STATUS_CONFIG[status]?.badgeStyle || 'bg-muted text-muted-foreground';
  },

  /**
   * Sort events by status order
   */
  sortByStatus: (events: CalendarEvent[]): CalendarEvent[] => {
    return [...events].sort((a, b) => {
      const aOrder = EVENT_STATUS_CONFIG[a.status as EventStatus]?.sortOrder || 999;
      const bOrder = EVENT_STATUS_CONFIG[b.status as EventStatus]?.sortOrder || 999;
      return aOrder - bOrder;
    });
  },

  /**
   * Group events by status with proper ordering
   */
  groupByStatus: (events: CalendarEvent[]) => {
    const groups = {
      proposed: [] as CalendarEvent[],
      confirmed: [] as CalendarEvent[],
      ready: [] as CalendarEvent[],
      cancelled: [] as CalendarEvent[],
      doneAndDusted: [] as CalendarEvent[]
    };

    events.forEach(event => {
      switch (event.status) {
        case 'proposed':
          groups.proposed.push(event);
          break;
        case 'confirmed':
          groups.confirmed.push(event);
          break;
        case 'invoice ready':
          groups.ready.push(event);
          break;
        case 'cancelled':
          // Past cancelled events go to done and dusted
          const isPast = new Date(event.date) < new Date();
          if (isPast) {
            groups.doneAndDusted.push(event);
          } else {
            groups.cancelled.push(event);
          }
          break;
        case 'invoiced':
          groups.doneAndDusted.push(event);
          break;
        default:
          groups.proposed.push(event);
      }
    });

    // Sort each group by date
    Object.values(groups).forEach(group => {
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return groups;
  },

  /**
   * Check if event is done and dusted (archived)
   */
  isDoneAndDusted: (event: CalendarEvent): boolean => {
    if (event.status === 'invoiced') return true;
    if (event.status === 'cancelled') {
      const isPast = new Date(event.date) < new Date();
      return isPast;
    }
    return false;
  },

  /**
   * Get human-readable status summary
   */
  getStatusSummary: (events: CalendarEvent[]) => {
    const grouped = statusUtils.groupByStatus(events);
    const total = events.length;
    
    return {
      total,
      proposed: grouped.proposed.length,
      confirmed: grouped.confirmed.length,
      ready: grouped.ready.length,
      cancelled: grouped.cancelled.length,
      archived: grouped.doneAndDusted.length,
      active: total - grouped.doneAndDusted.length
    };
  }
} as const;

/**
 * SECTION VARIANT MAPPING
 * Maps status to section display variants
 */
export const STATUS_TO_VARIANT = {
  proposed: 'warning' as const,
  confirmed: 'success' as const,
  'invoice ready': 'info' as const,
  cancelled: 'critical' as const,
  invoiced: 'operational' as const
} as const;

/**
 * Export for backward compatibility
 */
export const STATUS_CONFIG = EVENT_STATUS_CONFIG;