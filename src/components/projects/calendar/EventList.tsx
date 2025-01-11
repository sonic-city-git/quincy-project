import { CalendarEvent } from "@/types/events";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, CheckCircle, HelpCircle, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EventListProps {
  events: CalendarEvent[];
}

export function EventList({ events }: EventListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Sort events by date within each status group
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group events by status
  const groupedEvents = {
    proposed: sortedEvents.filter(event => event.status === 'proposed'),
    confirmed: sortedEvents.filter(event => event.status === 'confirmed'),
    invoice: sortedEvents.filter(event => event.status === 'invoice'),
    cancelled: sortedEvents.filter(event => event.status === 'cancelled'),
  };

  const handleStatusChange = async (event: CalendarEvent, newStatus: CalendarEvent['status']) => {
    try {
      const { error } = await supabase
        .from('project_events')
        .update({ status: newStatus })
        .eq('date', format(event.date, 'yyyy-MM-dd'))
        .eq('name', event.name);

      if (error) throw error;

      // Invalidate the events query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ['events'] });

      toast({
        title: "Status Updated",
        description: `Event status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating event status:', error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    }
  };

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

  const renderEventCard = (event: CalendarEvent) => (
    <Card key={`${event.date}-${event.name}`} className="p-4">
      <div className="grid grid-cols-[160px_1fr_auto_auto] items-center gap-6">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="flex items-center gap-2"
            >
              {getStatusIcon(event.status)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleStatusChange(event, 'proposed')}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4 text-yellow-500" />
              Proposed
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange(event, 'confirmed')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              Confirmed
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange(event, 'invoice')}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4 text-blue-500" />
              Invoice
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange(event, 'cancelled')}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4 text-red-500" />
              Cancelled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );

  const renderEventSection = (status: string, events: CalendarEvent[]) => {
    if (events.length === 0) return null;
    
    return (
      <div key={status} className="space-y-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <h3 className="text-lg font-semibold">{getStatusText(status)}</h3>
        </div>
        <div className="grid gap-3">
          {events.map(renderEventCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderEventSection('proposed', groupedEvents.proposed)}
      {renderEventSection('confirmed', groupedEvents.confirmed)}
      {renderEventSection('invoice', groupedEvents.invoice)}
      {renderEventSection('cancelled', groupedEvents.cancelled)}
    </div>
  );
}