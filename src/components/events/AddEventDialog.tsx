import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EventType } from "@/types/events";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { useEvents } from "@/contexts/EventsContext";

interface AddEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  date?: Date;
}

export const AddEventDialog = ({
  isOpen,
  onOpenChange,
  date,
}: AddEventDialogProps) => {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("Show");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addEvent } = useEvents();

  const handleSubmit = async () => {
    if (!date) return;

    setIsSubmitting(true);
    try {
      const finalEventName = eventName.trim() || eventType;
      await addEvent(date, finalEventName, eventType);
      setEventName("");
      setEventType("Show");
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!date) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event for {format(date, 'dd.MM.yy')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="font-semibold">Event Name:</span>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name (optional)"
            />
          </div>
          <div className="space-y-2">
            <span className="font-semibold">Event Type:</span>
            <Select value={eventType} onValueChange={(value) => setEventType(value as EventType)}>
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
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Event"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};