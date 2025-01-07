import { useState } from "react";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

const EVENT_TYPES = [
  "Show",
  "Travel",
  "Preprod",
  "INT Storage",
  "EXT Storage"
] as const;

interface AddEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (eventName: string, eventType: typeof EVENT_TYPES[number]) => void;
  date: Date | undefined;
}

export const AddEventDialog = ({
  isOpen,
  onOpenChange,
  onSubmit,
  date,
}: AddEventDialogProps) => {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<typeof EVENT_TYPES[number]>("Show");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If no event name is provided, use the event type as the name
    const finalEventName = eventName.trim() || eventType;
    onSubmit(finalEventName, eventType);
    setEventName("");
    setEventType("Show");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
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
              onValueChange={(value) => setEventType(value as typeof EVENT_TYPES[number])}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Add Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};