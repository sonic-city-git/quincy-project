import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarEvent, EventType } from "@/types/events"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { useEventTypes } from "@/hooks/useEventTypes"

interface EditEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent;
  onSave: (event: CalendarEvent) => void;
}

export const EditEventDialog = ({
  isOpen,
  onOpenChange,
  event,
  onSave,
}: EditEventDialogProps) => {
  const { data: eventTypes } = useEventTypes();
  
  if (!event) return null;

  const [name, setName] = useState(event.name);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState(event.type.id);

  useEffect(() => {
    if (event) {
      setName(event.name);
      setSelectedEventTypeId(event.type.id);
    }
  }, [event]);

  const selectedEventType = eventTypes?.find(et => et.id === selectedEventTypeId);

  const handleSave = () => {
    if (!selectedEventType) return;
    
    onSave({
      ...event,
      name: name.trim() || selectedEventType.name,
      type: selectedEventType,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="font-semibold">Event Name:</span>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Event name (optional)"
            />
          </div>
          <div className="space-y-2">
            <span className="font-semibold">Event Type:</span>
            <Select value={selectedEventTypeId} onValueChange={setSelectedEventTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes?.map(eventType => (
                  <SelectItem key={eventType.id} value={eventType.id}>
                    {eventType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="font-semibold">Date:</span> {format(event.date, 'dd.MM.yy')}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!selectedEventType}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};