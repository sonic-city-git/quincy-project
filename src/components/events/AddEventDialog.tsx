import { useState } from "react";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EventType } from "@/types/events";
import { format } from "date-fns";

interface AddEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventName: string, eventType: EventType) => void;
  date: Date | undefined;
  projectId: string | undefined;
}

export const AddEventDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  date,
  projectId,
}: AddEventDialogProps) => {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("Show");
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('AddEventDialog - projectId:', projectId); // Debug log

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      console.error('Missing date:', date);
      return;
    }
    
    if (!projectId) {
      console.error('Missing projectId:', projectId);
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const finalEventName = eventName.trim() || eventType;
      await onSubmit(finalEventName, eventType);
      setEventName("");
      setEventType("Show");
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>
            Add an event for {date ? format(date, 'dd.MM.yy') : ''}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Enter event name (optional)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventType">Type</Label>
            <Select 
              value={eventType} 
              onValueChange={(value) => setEventType(value as EventType)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Show">Show</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Preprod">Preprod</SelectItem>
                <SelectItem value="INT Storage">INT Storage</SelectItem>
                <SelectItem value="EXT Storage">EXT Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !projectId}
            >
              {isSubmitting ? "Adding..." : "Add Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};