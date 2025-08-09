/**
 * 📅 EVENT DOMAIN HOOKS
 * 
 * All hooks related to events and event management.
 * Sync operations eliminated in favor of hybrid event ownership model.
 * Phase 6: Added operational intelligence hooks for real-time conflict detection.
 */

export { useConsolidatedEvents, useProjectEvents, useCalendarEvents } from './useConsolidatedEvents';
export { useEventDeletion } from './useEventDeletion';
export { useEventDialog } from './useEventDialog';
export { useEventTypes } from './useEventTypes';
export { 
  useEventOperationalStatus, 
  useEventEquipmentStatus, 
  useEventCrewStatus 
} from './useEventOperationalStatus';
