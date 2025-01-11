import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EventType } from "@/types/events";
import { useState } from "react";

const ALLOWED_EVENT_TYPES = ['Preprod', 'INT Storage', 'EXT Storage', 'Hours'];

interface MultiEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dates: Date[];
  eventTypes: EventType[];
  onAddEvents: (name: string, eventType: EventType) => void;
}

export function MultiEventDialog({
  isOpen,
  onClose,
  dates,
  eventTypes,
  onAddEvents,
}: MultiEventDialogProps) {
  const [name, setName] = useState("");
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string>("");

  const filteredEventTypes = eventTypes.filter(type => 
    ALLOWED_EVENT_TYPES.includes(type.name)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventType = eventTypes.find(type => type.id === selectedEventTypeId);
    if (eventType) {
      onAddEvents(name, eventType);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Events for {dates.length} Days</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Event Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter event name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="eventType" className="text-sm font-medium">
                Event Type
              </label>
              <Select
                value={selectedEventTypeId}
                onValueChange={setSelectedEventTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {filteredEventTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Events</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}