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
import { useState } from "react";
import { format } from "date-fns";

interface AddEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
  eventTypes: EventType[];
  onAddEvent: (date: Date, name: string, eventType: EventType) => Promise<CalendarEvent>;
}

export function AddEventDialog({
  isOpen,
  onClose,
  date,
  eventTypes,
  onAddEvent,
}: AddEventDialogProps) {
  const [name, setName] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !selectedEventType || !name) return;

    const eventType = eventTypes.find(type => type.id === selectedEventType);
    if (!eventType) return;

    setIsSubmitting(true);
    try {
      await onAddEvent(date, name, eventType);
      handleClose();
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setSelectedEventType("");
    onClose();
  };

  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event for {format(date, 'dd.MM.yyyy')}</DialogTitle>
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
              {isSubmitting ? "Adding..." : "Add Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}