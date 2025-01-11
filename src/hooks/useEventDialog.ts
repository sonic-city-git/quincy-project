import { useState } from "react";
import { CalendarEvent } from "@/types/events";

export const useEventDialog = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [addEventCallback, setAddEventCallback] = useState<((date: Date, name: string, eventType: any) => void) | null>(null);

  const openAddDialog = (date: Date, callback?: (date: Date, name: string, eventType: any) => void) => {
    setSelectedDate(date);
    setIsAddDialogOpen(true);
    if (callback) {
      setAddEventCallback(() => callback);
    }
  };

  const closeAddDialog = () => {
    setSelectedDate(null);
    setIsAddDialogOpen(false);
    setAddEventCallback(null);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const closeEditDialog = () => {
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