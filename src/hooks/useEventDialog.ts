import { useState } from "react";
import { CalendarEvent } from "@/types/events";

export const useEventDialog = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent>();

  const openAddDialog = (date: Date) => {
    setSelectedDate(date);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  };

  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    setSelectedDate(undefined);
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedEvent(undefined);
  };

  return {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    openEditDialog,
    closeAddDialog,
    closeEditDialog,
  };
};