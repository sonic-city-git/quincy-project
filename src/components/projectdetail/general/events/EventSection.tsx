import { CalendarEvent } from "@/types/events";
import { EventCard } from "./EventCard";
import { EventGrid, EventGridColumns, EventSectionTableHeader } from "./layout/EventGrid";
import { EventContent } from "./layout/EventContent";
import { EventStatus } from "./components/EventStatus";
import { EventEquipment } from "./components/EventEquipment";
import { EventCrew } from "./components/EventCrew";
import { formatPrice } from "@/utils/priceFormatters";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEquipmentSync } from '@/hooks/useEquipmentSync';
import { useState } from 'react';
import { STATUS_COLORS } from "@/components/dashboard/shared/StatusCard";

interface EventSectionProps {
  title: string;
  events: CalendarEvent[];
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: ((event: CalendarEvent) => void) | undefined;
  hideEdit?: boolean;
  hideHeader?: boolean;
  variant?: 'warning' | 'success' | 'info' | 'critical' | 'operational';
}

export function EventSection({ 
  title, 
  events, 
  onStatusChange, 
  onEdit,
  hideEdit,
  hideHeader,
  variant = 'info'
}: EventSectionProps) {
  const eventType = events[0]?.type;
  
  // Calculate total prices for the section
  const totalEquipmentPrice = events.reduce((sum, event) => {
    return sum + (event.equipment_price || 0);
  }, 0);
  
  const totalCrewPrice = events.reduce((sum, event) => {
    return sum + (event.crew_price || 0);
  }, 0);
  
  const totalPrice = events.reduce((sum, event) => {
    return sum + (event.total_price || 0);
  }, 0);

  // Get the appropriate total label based on the section title
  const getTotalLabel = () => {
    const status = title.toLowerCase();
    if (status === 'confirmed') return 'Confirmed Total';
    if (status === 'proposed') return 'Proposed Total';
    if (status === 'invoice ready') return 'Ready Total';
    if (status === 'cancelled') return 'Cancelled Total';
    return 'Section Total';
  };

  return (
    <div className={cn(
      'rounded-lg overflow-hidden',
      'bg-background border border-border',
      'shadow-sm hover:shadow-md transition-shadow duration-200'
    )}>
      {!hideHeader && (
        <EventSectionHeader 
          title={title}
          events={events}
          variant={variant}
          onStatusChange={onStatusChange}
        />
      )}
      
      <EventContent variant="list" spacing="sm" className="-mt-2 overflow-hidden">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onStatusChange={onStatusChange}
            onEdit={hideEdit ? undefined : onEdit}
            sectionTitle={title}
          />
        ))}
        
        {/* Enhanced Summary Row - show for all sections with totals */}
        {events.length > 0 && (totalEquipmentPrice > 0 || totalCrewPrice > 0 || totalPrice > 0) && (
          <EventSectionSummary
            title={getTotalLabel()}
            totalEquipment={totalEquipmentPrice}
            totalCrew={totalCrewPrice}
            totalPrice={totalPrice}
            eventCount={events.length}
            variant={variant}
          />
        )}
      </EventContent>
    </div>
  );
}

/**
 * Professional section header with design system integration
 */
function EventSectionHeader({ 
  title, 
  events, 
  variant, 
  onStatusChange 
}: {
  title: string;
  events: CalendarEvent[];
  variant: 'warning' | 'success' | 'info' | 'critical' | 'operational';
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}) {
  const eventType = events[0]?.type;
  const queryClient = useQueryClient();
  const { syncEvents } = useEquipmentSync();
  const [isSyncingCrew, setIsSyncingCrew] = useState(false);
  
  // Get design system colors based on variant
  const statusColors = STATUS_COLORS[variant] || STATUS_COLORS.info;

  // Check if events need equipment/crew
  const needsEquipment = events.some(event => event.type?.needs_equipment);
  const needsCrew = events.some(event => event.type?.needs_crew);
  const isCancelled = title.toLowerCase() === 'cancelled';
  const isInvoiceReady = title.toLowerCase() === 'invoice ready';

  // Handle bulk equipment sync for all events in section
  const handleSyncSectionEquipment = async () => {
    if (!events.length) return;
    await syncEvents(events.map(e => ({ id: e.id, project_id: e.project_id, variant_name: e.variant_name })));
  };

  // Handle bulk crew sync for all events in section
  const handleSyncSectionCrew = async () => {
    if (!events.length) return;
    setIsSyncingCrew(true);
    
    try {
      let totalSynced = 0;
      
      for (const event of events) {
                       const { error } = await supabase.rpc('sync_event_crew', {
                 p_event_id: event.id,
                 p_project_id: event.project_id,
                 p_variant_name: event.variant_name || 'default'
               });

        if (error) {
          console.error('❌ Crew sync failed for event:', event.id, error);
        } else {
          totalSynced++;
        }
      }

      // Invalidate queries to refresh UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events', events[0].project_id] }),
        queryClient.invalidateQueries({ queryKey: ['crew-sync-status'] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      ]);

      if (totalSynced === events.length) {
        toast.success(`Preferred crew synced for all ${totalSynced} events`);
      } else if (totalSynced > 0) {
        toast.success(`Preferred crew synced for ${totalSynced} of ${events.length} events`);
      } else {
        toast.error("Failed to sync crew for any events");
      }
    } catch (error: any) {
      console.error('❌ Unexpected error during section crew sync:', error);
      toast.error("Failed to sync section crew");
    } finally {
      setIsSyncingCrew(false);
    }
  };
  
  return (
    <div className={cn(
      'rounded-t-lg overflow-hidden',
      'bg-gradient-to-br', statusColors.bg,
      'border', statusColors.border,
      'shadow-sm'
    )}>
      {/* Section Header */}
      <div className="px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <EventStatus
            event={events[0]}
            variant="icon"
            onStatusChange={onStatusChange}
          />
          <h3 className="text-sm font-bold tracking-tight leading-6 text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground/80 font-medium whitespace-nowrap flex items-center h-6">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      
      {/* Column Headers */}
      <EventSectionTableHeader 
        events={events}
        onStatusChange={onStatusChange}
      />
      
    </div>
  );
}

/**
 * Professional summary row for section totals
 */
function EventSectionSummary({
  title,
  totalEquipment,
  totalCrew,
  totalPrice,
  eventCount,
  variant = 'info'
}: {
  title: string;
  totalEquipment: number;
  totalCrew: number;
  totalPrice: number;
  eventCount: number;
  variant?: 'warning' | 'success' | 'info' | 'critical' | 'operational';
}) {
  // Use design system status colors
  const statusColors = STATUS_COLORS[variant] || STATUS_COLORS.info;

  return (
    <div className={cn(
      'mt-4 rounded-lg shadow-sm border',
      'bg-gradient-to-br', statusColors.bg,
      statusColors.border
    )}>
      <EventGrid variant="card">
        {/* Date Column - Total text */}
        <EventGridColumns.Date>
          <div className="font-bold text-foreground tracking-wide">
            {title}
          </div>
        </EventGridColumns.Date>
        
        {/* Event Column - empty */}
        <EventGridColumns.Event>
        </EventGridColumns.Event>
        
        {/* Type Badge Column - empty, only on small+ to match grid */}
        <div className="hidden sm:block"></div>
        
        {/* Variant Column - empty, only on tablet+ to match grid */}
        <div className="hidden md:block"></div>
        

        
        {/* Equipment Icon Column - empty */}
        <EventGridColumns.Icon>
        </EventGridColumns.Icon>
        
        {/* Crew Icon Column - empty */}
        <EventGridColumns.Icon>
        </EventGridColumns.Icon>
        
        {/* Status Action Column - empty */}
        <EventGridColumns.Action>
        </EventGridColumns.Action>
        
        {/* Equipment Price - Hide FIRST when space is tight (show only on wide+ screens) */}
        <EventGridColumns.Price variant="muted" className="hidden xl:flex">
          {formatPrice(totalEquipment)}
        </EventGridColumns.Price>
        
        {/* Crew Price - Hide SECOND when space is tight (show from desktop+ screens) */}
        <EventGridColumns.Price variant="muted" className="hidden lg:flex">
          {formatPrice(totalCrew)}
        </EventGridColumns.Price>
        
        {/* Total Price - HIGHEST PRIORITY, always visible */}
        <EventGridColumns.Price variant="muted">
          {formatPrice(totalPrice)}
        </EventGridColumns.Price>
      </EventGrid>
    </div>
  );
}