import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Clock, CheckCircle, HelpCircle, Send, XCircle } from "lucide-react";

interface EventListProps {
  events: CalendarEvent[];
}

export function EventList({ events }: EventListProps) {
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invoice':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default: // 'proposed'
        return <HelpCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Project Events</h2>
      <div className="grid gap-2">
        {sortedEvents.map((event, index) => (
          <Card key={`${event.date}-${index}`} className="p-3">
            <div className="grid grid-cols-[140px_1fr_auto_auto_auto] items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(event.date, 'dd.MM.yyyy')}
                </span>
              </div>
              <h3 className="font-medium text-sm truncate">{event.name}</h3>
              <div 
                className={`text-xs px-2 py-0.5 rounded-full ${event.type.color}`}
              >
                {event.type.name}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {getStatusIcon(event.status)}
                <span>{getStatusText(event.status)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground opacity-50">
                <Clock className="h-3.5 w-3.5" />
                <span>Options</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}