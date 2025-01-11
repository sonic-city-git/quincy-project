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
import { useState, useEffect } from "react";
import { getStatusIcon } from "@/utils/eventFormatters";

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

const EVENT_STATUSES = ['proposed', 'confirmed', 'invoice ready', 'cancelled'] as const;

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
  const [status, setStatus] = useState<CalendarEvent['status']>(
    event?.status || 'proposed'
  );

  const selectedEventType = eventTypes.find(type => type.id === selectedType);
  const isNameRequired = selectedEventType?.name === 'Show' || selectedEventType?.name === 'Double Show';

  useEffect(() => {
    if (event) {
      setName(event.name);
      setSelectedType(event.type.id);
      setStatus(event.status);
    } else {
      // Reset to default values when adding a new event
      setStatus('proposed');
      setSelectedType(eventTypes[0]?.id || '');
    }
  }, [event, eventTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isNameRequired && !name.trim()) {
      return; // Don't submit if name is required but empty
    }

    const eventType = eventTypes.find((type) => type.id === selectedType);
    if (!eventType) return;

    if (event && onUpdateEvent) {
      await onUpdateEvent({
        ...event,
        name,
        type: eventType,
        status,
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
          <div className="space-y-2">
            <Input
              placeholder={isNameRequired ? "Event name (required)" : "Event name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isNameRequired}
            />
          </div>

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

          <Select
            value={status}
            onValueChange={(value) => setStatus(value as CalendarEvent['status'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map((statusOption) => (
                <SelectItem 
                  key={statusOption} 
                  value={statusOption}
                  className="flex items-center gap-2 w-full"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getStatusIcon(statusOption)}
                    <span className="truncate">
                      {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                    </span>
                  </div>
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