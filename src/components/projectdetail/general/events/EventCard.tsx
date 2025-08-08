import { CalendarEvent, EventType } from "@/types/events";
import { EVENT_COLORS } from "@/constants/eventColors";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/utils/priceFormatters";
import { EventGrid, EventGridColumns } from "./layout/EventGrid";
import { EventEquipment } from "./components/EventEquipment";
import { EventCrew } from "./components/EventCrew";
import { EventStatus } from "./components/EventStatus";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Calendar, MapPin } from "lucide-react";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { cn } from "@/lib/utils";
import { COMPONENT_CLASSES } from "@/design-system";
import { statusUtils } from "@/constants/eventStatus";
import { useUnifiedEventSync } from "@/hooks/useUnifiedEventSync";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Utility function to extract city from location string or structured data
function getDisplayLocation(location: string, locationData?: any): { display: string; full: string } {
  // If we have structured location data, use the city
  if (locationData?.city) {
    return {
      display: locationData.city,
      full: location // Use the full display name for hover
    };
  }
  
  // Parse common location formats to extract city
  const locationStr = location.trim();
  
  // Handle formats like "Oslo, Norway" or "London, UK"
  if (locationStr.includes(',')) {
    const parts = locationStr.split(',').map(p => p.trim());
    return {
      display: parts[0], // First part is usually the city
      full: locationStr
    };
  }
  
  // Handle formats like "Oslo Norway" (space-separated)
  const words = locationStr.split(' ');
  if (words.length > 1) {
    // If last word looks like a country code (2-3 uppercase letters), exclude it
    const lastWord = words[words.length - 1];
    if (lastWord.length <= 3 && lastWord === lastWord.toUpperCase()) {
      return {
        display: words.slice(0, -1).join(' '),
        full: locationStr
      };
    }
    
    // If more than 2 words, take first 2 as city
    if (words.length > 2) {
      return {
        display: words.slice(0, 2).join(' '),
        full: locationStr
      };
    }
  }
  
  // If location is short (likely just a city), show as-is
  if (locationStr.length <= 15) {
    return {
      display: locationStr,
      full: locationStr
    };
  }
  
  // For long single strings, truncate intelligently
  return {
    display: locationStr.length > 15 ? locationStr.substring(0, 15) + '...' : locationStr,
    full: locationStr
  };
}

// Utility function to get event type color styling for badges
export function getEventTypeColorStyle(eventType: EventType): string {
  // Use the color from the event type or fall back to EVENT_COLORS mapping
  const typeColor = eventType.color || EVENT_COLORS[eventType.name];
  
  if (!typeColor) return 'bg-muted text-muted-foreground';
  
  // Convert hex colors to Tailwind badge styling
  const hexToTailwindMap: Record<string, string> = {
    // Green shades (Show, Double Show)
    '#22C55E': 'bg-green-500/20 text-foreground border border-green-500/30',
    '#16A34A': 'bg-green-600/20 text-foreground border border-green-600/30',
    '#15803D': 'bg-green-700/20 text-foreground border border-green-700/30',
    
    // Yellow shades (Preprod)
    '#EAB308': 'bg-yellow-500/20 text-foreground border border-yellow-500/30',
    '#CA8A04': 'bg-yellow-600/20 text-foreground border border-yellow-600/30',
    
    // Red shades (EXT Storage)
    '#DC2626': 'bg-red-500/20 text-foreground border border-red-500/30',
    '#B91C1C': 'bg-red-600/20 text-foreground border border-red-600/30',
    
    // Pink shades (INT Storage)
    '#EC4899': 'bg-pink-500/20 text-foreground border border-pink-500/30',
    '#DB2777': 'bg-pink-600/20 text-foreground border border-pink-600/30',
    
    // Blue shades (Travel)
    '#3B82F6': 'bg-blue-500/20 text-foreground border border-blue-500/30',
    '#2563EB': 'bg-blue-600/20 text-foreground border border-blue-600/30',
    
    // Orange shades (Hours)
    '#F97316': 'bg-orange-500/20 text-foreground border border-orange-500/30',
    '#EA580C': 'bg-orange-600/20 text-foreground border border-orange-600/30',
    
    // Purple shades
    '#A855F7': 'bg-purple-500/20 text-foreground border border-purple-500/30',
    '#9333EA': 'bg-purple-600/20 text-foreground border border-purple-600/30',
    
    // Indigo shades
    '#6366F1': 'bg-indigo-500/20 text-foreground border border-indigo-500/30',
    '#4F46E5': 'bg-indigo-600/20 text-foreground border border-indigo-600/30',
  };
  
  // Also handle Tailwind class names (fallback from EVENT_COLORS)
  const tailwindClassMap: Record<string, string> = {
    'bg-green-500': 'bg-green-500/20 text-foreground border border-green-500/30',
    'bg-blue-500': 'bg-blue-500/20 text-foreground border border-blue-500/30',
    'bg-yellow-500': 'bg-yellow-500/20 text-foreground border border-yellow-500/30',
    'bg-pink-500': 'bg-pink-500/20 text-foreground border border-pink-500/30',
    'bg-red-500': 'bg-red-500/20 text-foreground border border-red-500/30',
    'bg-orange-500': 'bg-orange-500/20 text-foreground border border-orange-500/30',
    'bg-purple-500': 'bg-purple-500/20 text-foreground border border-purple-500/30',
    'bg-indigo-500': 'bg-indigo-500/20 text-foreground border border-indigo-500/30',
  };
  
  // Try hex mapping first, then Tailwind class mapping
  return hexToTailwindMap[typeColor] || tailwindClassMap[typeColor] || 'bg-muted text-muted-foreground';
}

interface EventCardProps {
  event: CalendarEvent;
  onStatusChange: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
  onEdit: ((event: CalendarEvent) => void) | undefined;
  sectionTitle?: string;
}

export function EventCard({ event, onStatusChange, onEdit, sectionTitle }: EventCardProps) {
  const isEditingDisabled = !statusUtils.canEdit(event);
  
  // Get unified sync data and actions
  const { data: syncData, actions: syncActions } = useUnifiedEventSync(event);

  // Handle crew sync using unified actions
  const handleSyncPreferredCrew = async () => {
    await syncActions.syncCrew();
  };
  
  // Get status pattern using unified system
  const statusPattern = statusUtils.getPattern(event.status as any);
  
  // Get event type color styling
  const getTypeColorStyle = () => {
    return getEventTypeColorStyle(event.type);
  };

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          COMPONENT_CLASSES.card.hover,
          'transition-all duration-200 ease-in-out group',
          statusPattern.bg,
          statusPattern.border && `border-l-4 ${statusPattern.border}`,
          'mb-0.5 shadow-sm hover:shadow-md',
          'w-full overflow-hidden' // Prevent card overflow
        )}
      >
        <EventGrid variant="card">
          {/* Date */}
          <EventGridColumns.Date interactive={!!onEdit}>
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className="font-medium text-xs">
              {formatDisplayDate(event.date)}
            </span>
          </EventGridColumns.Date>
          
          {/* Event Name & Location */}
          <EventGridColumns.Event 
            interactive={!!onEdit}
            className={cn(onEdit && 'cursor-pointer')}
          >
            <div 
              className="space-y-0.5 w-full overflow-hidden min-w-0"
              onClick={onEdit ? () => onEdit(event) : undefined}
            >
              <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                {event.name}
              </h4>
              {event.location && (
                <p className="text-xs text-muted-foreground truncate flex items-center gap-0.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {getDisplayLocation(event.location, event.location_data).display}
                </p>
              )}
            </div>
          </EventGridColumns.Event>
          
          {/* Event Type Badge - Available from small screens (640px+) */}
          <div className="hidden sm:flex items-center px-0.5 overflow-hidden">
            <span className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0',
              'transition-all duration-200',
              getTypeColorStyle()
            )}>
              {event.type.name}
            </span>
          </div>

          {/* Variant - Available from tablet (768px+) */}
          <div className="hidden md:flex items-center overflow-hidden">
            {event.variant_name && event.variant_name !== 'default' ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-muted/50 text-muted-foreground border border-border/50 flex-shrink-0">
                {event.variant_name}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/60 font-semibold flex-shrink-0">
                default
              </span>
            )}
          </div>



          {/* Equipment Status */}
          <EventGridColumns.Icon>
            <EventEquipment
              event={event}
              variant="icon"
              disabled={isEditingDisabled}
              isSynced={syncData.equipment.synced}
              hasProjectEquipment={syncData.equipment.hasProjectEquipment}
            />
          </EventGridColumns.Icon>

          {/* Crew Status */}
          <EventGridColumns.Icon>
            <EventCrew
              event={event}
              variant="icon" 
              disabled={isEditingDisabled}
              isSynced={syncData.crew.synced}
              hasProjectRoles={syncData.crew.hasProjectRoles}
              onSyncPreferredCrew={handleSyncPreferredCrew}
            />
          </EventGridColumns.Icon>

          {/* Status Actions */}
          <EventGridColumns.Action>
            <EventStatus
              event={event}
              variant="manager"
              onStatusChange={onStatusChange}
              disabled={isEditingDisabled}
            />
          </EventGridColumns.Action>

          {/* Equipment Price - Hide FIRST when space is tight (show only on wide+ screens) */}
          <EventGridColumns.Price variant="muted" className="hidden xl:flex">
            {formatPrice(event.equipment_price)}
          </EventGridColumns.Price>

          {/* Crew Price - Hide SECOND when space is tight (show from desktop+ screens) */}
          <EventGridColumns.Price variant="muted" className="hidden lg:flex">
            {formatPrice(event.crew_price)}
          </EventGridColumns.Price>

          {/* Total Price - HIGHEST PRIORITY, always visible */}
          <EventGridColumns.Price variant="muted">
            {formatPrice(event.total_price)}
          </EventGridColumns.Price>
        </EventGrid>
      </Card>
    </TooltipProvider>
  );
}