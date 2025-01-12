import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarEvent, EventType } from "@/types/events";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { EventForm } from "./EventForm";

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
  const [name, setName] = useState(event?.name || "");
  const [selectedType, setSelectedType] = useState<string>(
    event?.type.id || eventTypes[0]?.id
  );
  const [status, setStatus] = useState<CalendarEvent['status']>(
    event?.status || 'proposed'
  );
  const [location, setLocation] = useState(event?.location || "");

  const selectedEventType = eventTypes.find(type => type.id === selectedType);
  const isNameRequired = selectedEventType?.name === 'Show' || selectedEventType?.name === 'Double Show';

  useEffect(() => {
    if (event) {
      setName(event.name);
      setSelectedType(event.type.id);
      setStatus(event.status);
      setLocation(event.location || "");
    } else {
      setStatus('proposed');
      setSelectedType(eventTypes[0]?.id || '');
      setLocation("");
    }
  }, [event, eventTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNameRequired && !name.trim()) {
      return;
    }

    const eventType = eventTypes.find((type) => type.id === selectedType);
    if (!eventType) return;

    if (event && onUpdateEvent) {
      await onUpdateEvent({
        ...event,
        name,
        type: eventType,
        status,
        location,
      });
    } else if (date && onAddEvent) {
      if (addEventCallback) {
        await addEventCallback(date, name, eventType);
      } else {
        await onAddEvent(date, name, eventType, status);
      }
    }

    setName("");
    onClose();
  };

  const handleDelete = async () => {
    if (event && onDeleteEvent) {
      await onDeleteEvent(event);
      onClose();
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