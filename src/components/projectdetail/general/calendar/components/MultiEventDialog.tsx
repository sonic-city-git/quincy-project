import { useState } from "react";
import { CalendarEvent, EventType } from "@/types/events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALLOWED_EVENT_TYPES = ['Preprod', 'INT Storage', 'EXT Storage'];

interface MultiEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dates: Date[];
  eventTypes: EventType[];
  onAddEvents: (name: string, eventType: EventType, status: CalendarEvent['status']) => void;
}

export function MultiEventDialog({
  isOpen,
  onClose,
  dates,
  eventTypes,
  onAddEvents
}: MultiEventDialogProps) {
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [status, setStatus] = useState<CalendarEvent['status']>("proposed");

  const filteredEventTypes = eventTypes.filter(type => 
    ALLOWED_EVENT_TYPES.includes(type.name)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEventType) {
      onAddEvents(selectedEventType.name, selectedEventType, status);
      onClose();
      setSelectedEventType(null);
      setStatus("proposed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Events to Multiple Dates</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select
              value={selectedEventType?.id || ""}
              onValueChange={(value) => {
                const eventType = filteredEventTypes.find(et => et.id === value);
                setSelectedEventType(eventType || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {filteredEventTypes.map((eventType) => (
                  <SelectItem key={eventType.id} value={eventType.id}>
                    {eventType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as CalendarEvent['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proposed">Proposed</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="invoice ready">Invoice Ready</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            Adding to {dates?.length || 0} selected date{(dates?.length || 0) !== 1 ? 's' : ''}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedEventType}>
              Add Events
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}