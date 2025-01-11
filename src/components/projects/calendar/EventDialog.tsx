import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date | null;
  event?: CalendarEvent | null;
  eventTypes: EventType[];
  onAddEvent?: (date: Date, name: string, eventType: EventType) => void;
  onUpdateEvent?: (event: CalendarEvent) => void;
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
  addEventCallback
}: EventDialogProps) {
  const [name, setName] = useState(event?.name || "");
  const [selectedType, setSelectedType] = useState<string>(
    event?.type.id || eventTypes[0]?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventType = eventTypes.find((type) => type.id === selectedType);
    if (!eventType) return;

    if (event && onUpdateEvent) {
      await onUpdateEvent({
        ...event,
        name,
        type: eventType,
      });
    } else if (date && onAddEvent) {
      if (addEventCallback) {
        await addEventCallback(date, name, eventType);
      } else {
        await onAddEvent(date, name, eventType);
      }
    }

    setName("");
    onClose();
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
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Event name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value)}
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
          <DialogFooter>
            <Button type="submit">
              {event ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}