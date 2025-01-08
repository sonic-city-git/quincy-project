import { AddEventDialog } from "../AddEventDialog";
import { EditEventDialog } from "../EditEventDialog";
import { CalendarEvent, EventType } from "@/types/events";

interface CalendarDialogsProps {
  isAddDialogOpen: boolean;
  isEditDialogOpen: boolean;
  selectedDate?: Date;
  selectedEvent?: CalendarEvent;
  projectId?: string;
  onCloseAddDialog: () => void;
  onCloseEditDialog: () => void;
  onEventSubmit: (eventName: string, eventType: EventType) => Promise<void>;
  onEventUpdate: (event: CalendarEvent) => Promise<void>;
}

export const CalendarDialogs = ({
  isAddDialogOpen,
  isEditDialogOpen,
  selectedDate,
  selectedEvent,
  projectId,
  onCloseAddDialog,
  onCloseEditDialog,
  onEventSubmit,
  onEventUpdate,
}: CalendarDialogsProps) => {
  return (
    <>
      <AddEventDialog
        isOpen={isAddDialogOpen}
        onOpenChange={onCloseAddDialog}
        onSubmit={onEventSubmit}
        date={selectedDate}
        projectId={projectId}
      />
      <EditEventDialog
        isOpen={isEditDialogOpen}
        onOpenChange={onCloseEditDialog}
        event={selectedEvent}
        onSave={onEventUpdate}
      />
    </>
  );
};