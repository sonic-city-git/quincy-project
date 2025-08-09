import { useState, useCallback } from "react";
import { CalendarEvent } from "@/types/events";

export const useEventDialog = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const openAddDialog = useCallback((date: Date) => {
    console.log('Opening add dialog for date:', date);
    setSelectedDate(date);
    setIsAddDialogOpen(true);
  }, []);

  const closeAddDialog = useCallback(() => {
    console.log('Closing add dialog');
    setSelectedDate(null);
    setIsAddDialogOpen(false);
  }, []);

  const openEditDialog = useCallback((event: CalendarEvent) => {
    console.log('Opening edit dialog for event:', event);
    setSelectedEvent(event);
    setIsEditDialogOpen(true);
  }, []);

  const closeEditDialog = useCallback(() => {
    console.log('Closing edit dialog');
    setSelectedEvent(null);
    setIsEditDialogOpen(false);
  }, []);

  return {
    selectedDate,
    isAddDialogOpen,
    isEditDialogOpen,
    selectedEvent,
    openAddDialog,
    closeAddDialog,
    openEditDialog,
    closeEditDialog,
  };
};