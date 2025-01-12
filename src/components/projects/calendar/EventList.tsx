import { CalendarEvent } from "@/types/events";
import { EventSectionContent } from "./components/EventSectionContent";
import { EventSectionHeader } from "./components/EventSectionHeader";
import { EventListEmpty } from "./components/EventListEmpty";
import { EventListLoading } from "./components/EventListLoading";
import { useEventUpdate } from "@/hooks/useEventUpdate";

interface EventListProps {
  events: CalendarEvent[];
  projectId: string;
  isLoading?: boolean;
}

export function EventList({ events, projectId, isLoading }: EventListProps) {
  const { updateEvent } = useEventUpdate(projectId);

  if (isLoading) {
    return <EventListLoading />;
  }

  if (!events.length) {
    return <EventListEmpty />;
  }

  const handleStatusChange = async (event: CalendarEvent, newStatus: CalendarEvent['status']) => {
    await updateEvent({ ...event, status: newStatus });
  };

  const handleEdit = (event: CalendarEvent) => {
    console.log('Edit event:', event);
    // Implement edit functionality
  };

  const upcomingEvents = events.filter(event => new Date(event.date) >= new Date());
  const pastEvents = events.filter(event => new Date(event.date) < new Date());

  return (
    <div className="space-y-6">
      {upcomingEvents.length > 0 && (
        <div>
          <EventSectionHeader title="Upcoming Events" />
          <EventSectionContent 
            events={upcomingEvents} 
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
          />
        </div>
      )}

      {pastEvents.length > 0 && (
        <div>
          <EventSectionHeader title="Past Events" />
          <EventSectionContent 
            events={pastEvents} 
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
          />
        </div>
      )}
    </div>
  );
}