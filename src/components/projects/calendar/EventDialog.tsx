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

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date?: Date;
  event?: CalendarEvent;
  eventTypes: EventType[];
  onAddEvent?: (date: Date, name: string, eventType: EventType) => Promise<CalendarEvent>;
  onUpdateEvent?: (event: CalendarEvent) => Promise<void>;
}

export function EventDialog({
  isOpen,
  onClose,
  date,
  event,
  eventTypes,
  onAddEvent,
  onUpdateEvent,
}: EventDialogProps) {
  const [name, setName] = useState("");
  const [selectedEventType, setSelectedEventType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!event;

  useEffect(() => {
    if (event) {
      setName(event.name);
      setSelectedEventType(event.type.id);
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventType) return;
    if (!isEditMode && !date) return;

    const eventType = eventTypes.find(type => type.id === selectedEventType);
    if (!eventType) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && event && onUpdateEvent) {
        const updatedEvent: CalendarEvent = {
          ...event,
          name: name.trim() || eventType.name,
          type: eventType,
        };
        await onUpdateEvent(updatedEvent);
      } else if (!isEditMode && date && onAddEvent) {
        // If it's not a Show/Double Show and name is empty, use event type name
        const eventName = (eventType.name === 'Show' || eventType.name === 'Double Show')
          ? name
          : (name.trim() || eventType.name);
        await onAddEvent(date, eventName, eventType);
      }
      handleClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} event:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setSelectedEventType("");
    onClose();
  };

  const selectedType = eventTypes.find(type => type.id === selectedEventType);
  const isNameRequired = selectedType?.name === 'Show' || selectedType?.name === 'Double Show';
  const displayDate = event?.date || date;

  if (!displayDate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit' : 'Add'} Event for {format(displayDate, 'dd.MM.yyyy')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Event Name {isNameRequired && <span className="text-red-500">*</span>}
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter event name"
              required={isNameRequired}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedEventType || (isNameRequired && !name.trim())}
            >
              {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save Changes" : "Add Event")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}