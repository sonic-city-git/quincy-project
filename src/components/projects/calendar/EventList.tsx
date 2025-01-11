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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invoice':
        return <Send className="h-5 w-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default: // 'proposed'
        return <HelpCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Project Events</h2>
      <div className="grid gap-3">
        {sortedEvents.map((event, index) => (
          <Card key={`${event.date}-${index}`} className="p-4">
            <div className="grid grid-cols-[160px_1fr_auto_auto_auto] items-center gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {format(event.date, 'dd.MM.yyyy')}
                </span>
              </div>
              <h3 className="font-medium text-base truncate">{event.name}</h3>
              <div 
                className={`text-sm px-3 py-1 rounded-full ${event.type.color}`}
              >
                {event.type.name}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {getStatusIcon(event.status)}
                <span>{getStatusText(event.status)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground opacity-50">
                <Clock className="h-4 w-4" />
                <span>Options</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}