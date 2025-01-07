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
  if (!event) return null;

  const [name, setName] = useState(event.name);
  const [type, setType] = useState<EventType>(event.type);

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      setName(event.name);
      setType(event.type);
    }
  }, [event]);

  const handleSave = () => {
    onSave({
      ...event,
      name,
      type,
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
              placeholder="Event name"
            />
          </div>
          <div className="space-y-2">
            <span className="font-semibold">Event Type:</span>
            <Select value={type} onValueChange={(value) => setType(value as EventType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Show">Show</SelectItem>
                <SelectItem value="Preprod">Preprod</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="INT Storage">INT Storage</SelectItem>
                <SelectItem value="EXT Storage">EXT Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="font-semibold">Date:</span> {event.date.toLocaleDateString()}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};