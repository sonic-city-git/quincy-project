
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarEvent, EventType } from "@/types/events";
import { useState } from "react";
import { useEventTypes } from "@/hooks/useEventTypes";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { EventForm } from "./EventForm";

interface AddEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onAddEvent: (date: Date, eventName: string, eventType: EventType, status: CalendarEvent['status']) => Promise<any>;
}

export function AddEventDialog({
  isOpen,
  onClose,
  selectedDate,
  onAddEvent,
}: AddEventDialogProps) {
  const { data: eventTypes = [] } = useEventTypes();
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [status, setStatus] = useState<CalendarEvent['status']>('proposed');
  const [location, setLocation] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    const eventType = eventTypes.find((type) => type.id === selectedType);
    if (!eventType) {
      toast.error("Please select an event type");
      return;
    }

    setIsPending(true);

    try {
      await onAddEvent(selectedDate, name.trim() || eventType.name, eventType, status);
      toast.success("Event created successfully");
      
      // Reset form
      setName("");
      setSelectedType("");
      setStatus('proposed');
      setLocation("");
      
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error("Failed to create event");
    } finally {
      setIsPending(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setName("");
    setSelectedType("");
    setStatus('proposed');
    setLocation("");
    onClose();
  };

  if (!selectedDate) return null;

  const selectedEventType = eventTypes.find(type => type.id === selectedType);
  const isNameRequired = selectedEventType?.name === 'Show' || selectedEventType?.name === 'Double Show';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Create a new event for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !selectedType}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
