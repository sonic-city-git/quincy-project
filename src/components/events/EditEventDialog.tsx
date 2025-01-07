import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarEvent } from "@/types/events"

interface EditEventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | undefined;
}

export const EditEventDialog = ({
  isOpen,
  onOpenChange,
  event,
}: EditEventDialogProps) => {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <span className="font-semibold">Event Name:</span> {event.name}
          </div>
          <div>
            <span className="font-semibold">Event Type:</span> {event.type}
          </div>
          <div>
            <span className="font-semibold">Date:</span> {event.date.toLocaleDateString()}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};