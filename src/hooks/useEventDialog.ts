import { useState } from "react";
import { CalendarEvent, EventType } from "@/types/events";

export const useEventDialog = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [addEventCallback, setAddEventCallback] = useState<((date: Date, name: string, eventType: EventType) => void) | null>(null);

  const openAddDialog = (date: Date, callback?: (date: Date, name: string, eventType: EventType) => void) => {
    console.log('Opening add dialog for date:', date);
    setSelectedDate(date);
    setIsAddDialogOpen(true);
    if (callback) {
      setAddEventCallback(() => callback);
    } else {
      setAddEventCallback(null);
    }
  };

  const closeAddDialog = () => {
    console.log('Closing add dialog');
    setSelectedDate(null);
    setIsAddDialogOpen(false);
    setAddEventCallback(null);
  };

  const openEditDialog = (event: CalendarEvent) => {
    console.log('Opening edit dialog for event:', event);
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    console.log('Closing edit dialog');
    setSelectedEvent(null);
    setIsEditDialogOpen(false);
  };

  return {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
    addEventCallback
  };
};