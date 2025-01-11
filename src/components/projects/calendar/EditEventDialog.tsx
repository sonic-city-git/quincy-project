import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarEvent, EventType } from "@/types/events";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface EditEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  eventTypes: EventType[];
  onUpdateEvent: (event: CalendarEvent) => Promise<void>;
}

export function EditEventDialog({
  isOpen,
  onClose,
  event,
  eventTypes,
  onUpdateEvent,
}: EditEventDialogProps) {
  const [name, setName] = useState(event?.name || "");
  const [selectedEventType, setSelectedEventType] = useState<string>(event?.type.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setName(event.name);
      setSelectedEventType(event.type.id);
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !selectedEventType || !name) return;

    const eventType = eventTypes.find(type => type.id === selectedEventType);
    if (!eventType) return;

    setIsSubmitting(true);
    try {
      const updatedEvent: CalendarEvent = {
        ...event,
        name,
        type: eventType,
      };
      await onUpdateEvent(updatedEvent);
      handleClose();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setSelectedEventType("");
    onClose();
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event for {format(event.date, 'dd.MM.yyyy')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Event Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Event Type
            </label>
            <Select
              value={selectedEventType}
              onValueChange={setSelectedEventType}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}