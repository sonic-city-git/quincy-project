/**
 * 🎯 EVENTS MODULE - CLEAN EXPORTS
 * 
 * Modular architecture following single responsibility principle
 * Fully integrated with QUINCY design system
 */

// Core Event Components
export { EventList } from './EventList';
export { EventSection } from './EventSection';
export { EventCard } from './EventCard';

// Layout Components  
export { EventGrid, EventGridColumns, EventTableHeader } from './layout/EventGrid';
export { EventContent } from './layout/EventContent';

// Feature Components (flat structure)
export { EventStatus } from './components/EventStatus';
export { EventEquipment } from './components/EventEquipment';
export { EventCrew } from './components/EventCrew';
export { EventActions } from './components/EventActions';

// Dialogs
export { EquipmentDifferenceDialog } from './dialogs/EquipmentDifferenceDialog';
export { CrewRolesDialog } from './dialogs/CrewRolesDialog';

// Utilities
export { eventUtils } from './utils';
export type { EventCardProps, EventSectionProps, EventListProps } from './types';