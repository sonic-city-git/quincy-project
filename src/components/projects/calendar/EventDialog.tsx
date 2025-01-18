import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarEvent, EventType } from "@/types/events";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { EventForm } from "./EventForm";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date | null;
  event?: CalendarEvent | null;
  eventTypes: EventType[];
  onAddEvent?: (date: Date, name: string, eventType: EventType, status: CalendarEvent['status']) => void;
  onUpdateEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  addEventCallback?: ((date: Date, name: string, eventType: EventType) => void) | null;
}

export function EventDialog({
  isOpen,
  onClose,
  date,
  event,
  eventTypes,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  addEventCallback
}: EventDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(event?.name || "");
  const [selectedType, setSelectedType] = useState<string>("");
  const [status, setStatus] = useState<CalendarEvent['status']>(
    event?.status || 'proposed'
  );
  const [location, setLocation] = useState(event?.location || "");

  // Initialize selectedType when eventTypes are available
  useEffect(() => {
    if (eventTypes.length > 0) {
      if (event) {
        setSelectedType(event.type.id);
      } else {
        setSelectedType(eventTypes[0].id);
      }
    }
  }, [event, eventTypes]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (event) {
      setName(event.name);
      setSelectedType(event.type.id);
      setStatus(event.status);
      setLocation(event.location || "");
    } else {
      setName("");
      setStatus('proposed');
      setLocation("");
      if (eventTypes.length > 0) {
        setSelectedType(eventTypes[0].id);
      }
    }
  }, [event, eventTypes, isOpen]);

  const selectedEventType = eventTypes.find(type => type.id === selectedType);
  const isNameRequired = selectedEventType?.name === 'Show' || selectedEventType?.name === 'Double Show';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNameRequired && !name.trim()) {
      toast.error("Event name is required for this event type");
      return;
    }

    const eventType = eventTypes.find((type) => type.id === selectedType);
    if (!eventType) {
      toast.error("Please select an event type");
      return;
    }

    try {
      if (event && onUpdateEvent) {
        await onUpdateEvent({
          ...event,
          name: name.trim() || eventType.name,
          type: eventType,
          status,
          location,
        });
      } else if (date) {
        if (addEventCallback) {
          await addEventCallback(date, name.trim() || eventType.name, eventType);
        } else if (onAddEvent) {
          await onAddEvent(date, name.trim() || eventType.name, eventType, status);
        }
        // Invalidate queries to refresh data including prices
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['events'] }),
          queryClient.invalidateQueries({ queryKey: ['calendar-events'] })
        ]);
      }

      setName("");
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async () => {
    if (event && onDeleteEvent) {
      try {
        await onDeleteEvent(event);
        onClose();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      setName("");
      onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {event ? "Edit Event" : "Add Event"}
          </DialogTitle>
          <DialogDescription>
            {event 
              ? "Make changes to your event below."
              : "Fill in the details to create a new event."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EventForm
            name={name}
            setName={setName}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            status={status}
            setStatus={setStatus}
            location={location}
            setLocation={setLocation}
            eventTypes={eventTypes}
            isNameRequired={isNameRequired}
          />

          <div className="flex justify-between items-center pt-4">
            <div>
              {event && onDeleteEvent && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <Button type="submit">
              {event ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
