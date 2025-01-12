import { HelpCircle, CheckCircle, Send, XCircle, Package, Users } from "lucide-react";
import { EventType } from "@/types/events";
import { EventStatusManager } from "../EventStatusManager";
import { CalendarEvent } from "@/types/events";

interface EventSectionHeaderProps {
  title: string;
  eventCount: number;
  eventType?: EventType;
  events?: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function EventSectionHeader({ 
  title, 
  eventCount, 
  eventType,
  events = [],
  onStatusChange 
}: EventSectionHeaderProps) {
  const getStatusIcon = () => {
    switch (title.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invoice ready':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default: // 'proposed'
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const isCancelled = title.toLowerCase() === 'cancelled';

  return (
    <div className="border-b border-border pb-2">
      <div className="grid grid-cols-[100px_165px_30px_30px_30px_1fr_100px_40px_40px] gap-2 items-center">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground">({eventCount})</span>
        </div>
        
        {/* Empty space for event name */}
        <div className="col-span-1" />
        
        {/* Icons column alignment */}
        <div className="flex items-center justify-center">
          {eventType?.needs_equipment && (
            <Package className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center justify-center">
          {eventType?.needs_crew && (
            <Users className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        {/* Empty space for event type */}
        <div className="col-span-1" />
        
        {/* Empty space for name */}
        <div className="col-span-1" />
        
        {/* Empty space for revenue */}
        <div className="col-span-1" />
        
        {/* Status manager alignment */}
        <div className="col-span-2 flex justify-end">
          {onStatusChange && (
            <EventStatusManager
              status={title.toLowerCase()}
              events={events}
              onStatusChange={onStatusChange}
              isCancelled={isCancelled}
            />
          )}
        </div>
      </div>
    </div>
  );
}