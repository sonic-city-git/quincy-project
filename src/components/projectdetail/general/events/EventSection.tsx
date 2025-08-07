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
    <div>
      {!hideHeader && (
        <EventSectionHeader 
          title={title}
          events={events}
          variant={variant}
          onStatusChange={onStatusChange}
        />
      )}
      
      {/* Column Headers - always show unless hidden */}
      {!hideHeader && (
        <EventSectionTableHeader 
          events={events}
          onStatusChange={onStatusChange}
        />
      )}
      
      <EventContent variant="list" spacing="sm" className="-mt-2">
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
    <Card className={cn(
      'border-b border-border/20 border-l-0 border-r-0 border-t-0 rounded-none shadow-none',
      'bg-gradient-to-r from-muted/10 to-muted/30'
    )}>
      <EventGrid variant="card" className="min-h-[48px] py-2 md:py-2">
        {/* Date Column - Section title (aligns with dates below) */}
        <EventGridColumns.Date>
          <div className="flex items-center gap-3">
            <EventStatus
              event={events[0]}
              variant="icon"
              onStatusChange={onStatusChange}
            />
            <h3 className="text-lg font-bold tracking-tight leading-6 text-white">{title}</h3>
            <span className="text-xs text-muted-foreground/80 font-medium whitespace-nowrap flex items-center h-6">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </span>
          </div>
        </EventGridColumns.Date>
        
        {/* Event Details Column - empty for spacing */}
        <EventGridColumns.Event>
        </EventGridColumns.Event>
        
        {/* Type Badge Column - empty, only on tablet+ to match grid */}
        <div className="hidden md:block"></div>
        
        {/* Variant Column - empty, only on tablet+ to match grid */}
        <div className="hidden md:block"></div>
        
        {/* Location Icon Column - empty */}
        <EventGridColumns.Icon>
        </EventGridColumns.Icon>
        
        {/* Equipment Icon Column - Section Equipment Sync */}
        <EventGridColumns.Icon>
          {!isCancelled && !isInvoiceReady && needsEquipment && (
            <EventEquipment
              events={events}
              variant="icon"
              onSync={handleSyncSectionEquipment}
            />
          )}
        </EventGridColumns.Icon>
        
        {/* Crew Icon Column - Section Crew Sync */}
        <EventGridColumns.Icon>
          {!isCancelled && !isInvoiceReady && needsCrew && (
            <EventCrew
              events={events}
              variant="icon"
              onSyncPreferredCrew={handleSyncSectionCrew}
            />
          )}
        </EventGridColumns.Icon>
        
        {/* Status Action Column - empty */}
        <EventGridColumns.Action>
        </EventGridColumns.Action>
        
        {/* Equipment Price Column - empty */}
        <EventGridColumns.Price>
        </EventGridColumns.Price>
        
        {/* Crew Price Column - empty */}
        <EventGridColumns.Price>
        </EventGridColumns.Price>
        
        {/* Total Price Column - empty */}
        <EventGridColumns.Price>
        </EventGridColumns.Price>
      </EventGrid>
    </Card>
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
  // Get status pattern for enhanced styling
  const getStatusPattern = () => {
    switch (variant) {
      case 'warning': return { bg: 'bg-gradient-to-r from-orange-50/20 to-orange-100/20', border: 'border-orange-200/30', accent: 'text-orange-600' };
      case 'success': return { bg: 'bg-gradient-to-r from-green-50/20 to-green-100/20', border: 'border-green-200/30', accent: 'text-green-600' };
      case 'info': return { bg: 'bg-gradient-to-r from-blue-50/20 to-blue-100/20', border: 'border-blue-200/30', accent: 'text-blue-600' };
      case 'critical': return { bg: 'bg-gradient-to-r from-red-50/20 to-red-100/20', border: 'border-red-200/30', accent: 'text-red-600' };
      default: return { bg: 'bg-gradient-to-r from-muted/10 to-muted/20', border: 'border-border/30', accent: 'text-muted-foreground' };
    }
  };

  const pattern = getStatusPattern();

  return (
    <div className={cn(
      'mt-4 rounded-lg shadow-sm',
      pattern.bg
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
        
        {/* Type Badge Column - empty, only on tablet+ to match grid */}
        <div className="hidden md:block"></div>
        
        {/* Variant Column - empty, only on tablet+ to match grid */}
        <div className="hidden md:block"></div>
        
        {/* Location Icon Column - empty */}
        <EventGridColumns.Icon>
        </EventGridColumns.Icon>
        
        {/* Equipment Icon Column - empty */}
        <EventGridColumns.Icon>
        </EventGridColumns.Icon>
        
        {/* Crew Icon Column - empty */}
        <EventGridColumns.Icon>
        </EventGridColumns.Icon>
        
        {/* Status Action Column - empty */}
        <EventGridColumns.Action>
        </EventGridColumns.Action>
        
        {/* Equipment Price - Hidden until tablet to prioritize Total */}
        <EventGridColumns.Price variant="muted" className="hidden md:flex">
          {formatPrice(totalEquipment)}
        </EventGridColumns.Price>
        
        {/* Crew Price - Hidden until tablet to prioritize Total */}
        <EventGridColumns.Price variant="muted" className="hidden md:flex">
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