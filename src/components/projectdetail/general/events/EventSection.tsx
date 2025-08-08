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
import { useBulkEventSync } from '@/hooks/useUnifiedEventSync';
import { useState, useMemo } from 'react';
import { useEventsWithReactivePricing } from '@/services/pricing/hooks';
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
  
  // 🔄 Get events with reactive pricing that automatically updates
  const { events: eventsWithPricing } = useEventsWithReactivePricing(events);
  
  // Calculate total prices for the section using reactive pricing
  const totalEquipmentPrice = eventsWithPricing.reduce((sum, event) => {
    return sum + (event.equipment_price || 0);
  }, 0);
  
  const totalCrewPrice = eventsWithPricing.reduce((sum, event) => {
    return sum + (event.crew_price || 0);
  }, 0);
  
  const totalPrice = eventsWithPricing.reduce((sum, event) => {
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
          events={eventsWithPricing}
          variant={variant}
          onStatusChange={onStatusChange}
        />
      )}
      
      <EventContent variant="list" spacing="sm" className="overflow-hidden mt-1">
        {eventsWithPricing.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onStatusChange={onStatusChange}
            onEdit={hideEdit ? undefined : onEdit}
            sectionTitle={title}
          />
        ))}
        
        {/* Enhanced Summary Row - show for all sections with totals */}
        {eventsWithPricing.length > 0 && (totalEquipmentPrice > 0 || totalCrewPrice > 0 || totalPrice > 0) && (
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
  const { syncEquipment, syncCrew, isSyncing } = useBulkEventSync(events);
  
  // Memoize expensive calculations to prevent re-renders
  const sectionMetadata = useMemo(() => {
    const statusColors = STATUS_COLORS[variant] || STATUS_COLORS.info;
    const titleLower = title.toLowerCase();
    
    return {
      statusColors,
      needsEquipment: events.some(event => event.type?.needs_equipment),
      needsCrew: events.some(event => event.type?.needs_crew),
      isCancelled: titleLower === 'cancelled',
      isInvoiceReady: titleLower === 'invoice ready'
    };
  }, [variant, title, events]);

  const { statusColors, needsEquipment, needsCrew, isCancelled, isInvoiceReady } = sectionMetadata;

  // Handle bulk sync operations using unified system
  const handleSyncSectionEquipment = async () => {
    if (!events.length) return;
    await syncEquipment();
  };

  const handleSyncSectionCrew = async () => {
    if (!events.length) return;
    await syncCrew();
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
        sectionTitle={title}
        events={events}
        onStatusChange={onStatusChange}
        onSyncSectionEquipment={handleSyncSectionEquipment}
        onSyncSectionCrew={handleSyncSectionCrew}
        onBulkStatusChange={(newStatus) => {
          events.forEach(event => onStatusChange(event, newStatus as any));
        }}
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
          <div className="font-bold text-sm text-foreground tracking-wide">
            {title}
          </div>
        </EventGridColumns.Date>
        
        {/* Event Column - empty */}
        <EventGridColumns.Event>
          <div></div>
        </EventGridColumns.Event>
        
        {/* Type Badge Column - empty, only on small+ to match grid */}
        <div className="hidden sm:block"></div>
        
        {/* Variant Column - empty, only on tablet+ to match grid */}
        <div className="hidden md:block"></div>
        

        
        {/* Equipment Icon Column - empty */}
        <EventGridColumns.Icon>
          <div></div>
        </EventGridColumns.Icon>
        
        {/* Crew Icon Column - empty */}
        <EventGridColumns.Icon>
          <div></div>
        </EventGridColumns.Icon>
        
        {/* Status Action Column - empty */}
        <EventGridColumns.Action>
          <div></div>
        </EventGridColumns.Action>
        
        {/* Equipment Price - Hide FIRST when space is tight (show only on wide+ screens) */}
        <EventGridColumns.Price variant="total" className="hidden xl:flex">
          {formatPrice(totalEquipment)}
        </EventGridColumns.Price>
        
        {/* Crew Price - Hide SECOND when space is tight (show from desktop+ screens) */}
        <EventGridColumns.Price variant="total" className="hidden lg:flex">
          {formatPrice(totalCrew)}
        </EventGridColumns.Price>
        
        {/* Total Price - HIGHEST PRIORITY, always visible */}
        <EventGridColumns.Price variant="total">
          {formatPrice(totalPrice)}
        </EventGridColumns.Price>
      </EventGrid>
    </div>
  );
}