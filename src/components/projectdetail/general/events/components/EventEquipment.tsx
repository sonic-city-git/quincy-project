/**
 * 🎯 EVENT EQUIPMENT COMPONENT
 * 
 * Shows operational equipment status: overbookings, warnings, subrentals
 * Replaces sync functionality with operational intelligence
 */

import React, { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarEvent } from '@/types/events';
import { useEquipmentConflicts } from '@/hooks/global/useConsolidatedConflicts';
import { OverBookedEquipmentDialog } from '../dialogs/OverBookedEquipmentDialog';

export interface EventEquipmentProps {
  event?: CalendarEvent;
  events?: CalendarEvent[];
  variant?: 'icon' | 'section';
  disabled?: boolean;
  className?: string;
}



export function EventEquipment({
  event,
  events = [],
  variant = 'icon',
  disabled = false,
  className
}: EventEquipmentProps) {
  const targetEvent = event || (events.length > 0 ? events[0] : null);
  const targetEvents = events.length > 0 ? events : (targetEvent ? [targetEvent] : []);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Don't render if no equipment needed or no valid event
  if (!targetEvent?.type?.needs_equipment || !targetEvent.id) {
    return null;
  }

  // Get real equipment conflicts for this event's date
  const { conflicts: equipmentConflicts, isLoading } = useEquipmentConflicts();
  
  // Check if this specific event has equipment conflicts
  const eventConflicts = useMemo(() => {
    if (!targetEvent?.date || !equipmentConflicts?.length) return [];
    
    // Format the event date to match conflict date format (YYYY-MM-DD)
    // Handle both Date objects and string dates
    const eventDate = targetEvent.date instanceof Date 
      ? targetEvent.date.toISOString().split('T')[0]
      : new Date(targetEvent.date).toISOString().split('T')[0];
    
    // Find conflicts on this event's date
    return equipmentConflicts.filter(conflict => conflict.date === eventDate);
  }, [targetEvent?.date, equipmentConflicts]);
  
  // Operational status logic based on requirements:
  // 🟢 Green: All equipment available (no overbookings) 
  // 🔴 Red: Overbooking detected on any equipment on this date
  // 🔵 Blue: Overbooking resolved with subrental (implement later)
  
  const hasOverbookings = eventConflicts.length > 0;
  const hasSubrentals = false; // TODO: Implement subrental detection (later)
  const isAvailable = !hasOverbookings && !hasSubrentals; // All equipment available

  // Determine operational status and styling based on requirements
  const getEquipmentStatus = () => {
    if (hasOverbookings) {
      return {
        color: 'text-red-600',
        tooltip: 'Equipment overbooking detected - click to view conflicts',
        clickable: true
      };
    }
    if (hasSubrentals) {
      return {
        color: 'text-blue-500',
        tooltip: 'Overbooking resolved with subrental equipment',
        clickable: false
      };
    }
    // Green - all equipment available
    return {
      color: 'text-green-600',
      tooltip: 'All equipment available',
      clickable: false
    };
  };

  const status = getEquipmentStatus();

  // Handle click for overbooking conflicts
  const handleClick = () => {
    if (status.clickable && hasOverbookings) {
      setDialogOpen(true);
    }
  };

  // Operational status icon with click handling for conflicts
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`h-10 w-10 flex items-center justify-center ${
              status.clickable ? 'cursor-pointer hover:bg-muted/50 rounded' : ''
            }`}
            onClick={handleClick}
          >
            <Package className={`h-5 w-5 ${status.color}`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status.tooltip}</p>
        </TooltipContent>
      </Tooltip>

      {/* Equipment Conflicts Dialog */}
      {targetEvent && (
        <OverBookedEquipmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          event={targetEvent}
          conflicts={eventConflicts}
        />
      )}
    </>
  );
}