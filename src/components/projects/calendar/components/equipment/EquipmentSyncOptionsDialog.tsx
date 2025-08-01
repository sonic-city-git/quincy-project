import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "@/types/events";
import { Calendar, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar/Calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EquipmentSyncOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionTitle: string;
  events: CalendarEvent[];
  onSyncAll: () => void;
  onSyncFromDate: (fromDate: Date) => void;
}

export function EquipmentSyncOptionsDialog({
  open,
  onOpenChange,
  sectionTitle,
  events,
  onSyncAll,
  onSyncFromDate,
}: EquipmentSyncOptionsDialogProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset date to today when dialog opens
  useEffect(() => {
    if (open) {
      const newToday = new Date();
      newToday.setHours(0, 0, 0, 0);
      setSelectedDate(newToday);
    }
  }, [open]);

  // Ensure events is an array and filter out any invalid events
  const validEvents = (events || []).filter(event => event && event.date);

  // Calculate events from selected date onwards
  const eventsFromSelectedDate = validEvents.filter(event => {
    try {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const compareDate = new Date(selectedDate);
      compareDate.setHours(0, 0, 0, 0);
      return eventDate >= compareDate;
    } catch {
      return false; // Invalid date
    }
  });

  const eventsBeforeSelectedDate = validEvents.filter(event => {
    try {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const compareDate = new Date(selectedDate);
      compareDate.setHours(0, 0, 0, 0);
      return eventDate < compareDate;
    } catch {
      return false; // Invalid date
    }
  });

  const handleSyncAll = () => {
    onSyncAll();
    onOpenChange(false);
  };

  const handleSyncFromDate = () => {
    onSyncFromDate(selectedDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Equipment to {sectionTitle} Events</DialogTitle>
          <DialogDescription>
            Choose which events to sync equipment to:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Sync All Events Option */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">Sync to All Events</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Sync equipment to all {validEvents.length} events in this section
              {eventsBeforeSelectedDate.length > 0 && ` (including all past and future events)`}
            </p>
            <Button 
              onClick={handleSyncAll}
              className="w-full"
              variant="default"
              disabled={validEvents.length === 0}
            >
              Sync All {validEvents.length} Events
            </Button>
          </div>

          {/* Sync From Date Option */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <h3 className="font-medium">Sync from Specific Date</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose a start date and sync equipment to all events from that date onwards
            </p>
            
            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date:</label>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selectedDates={[selectedDate]}
                    onDayClick={(date) => {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-sm text-muted-foreground">
              {eventsFromSelectedDate.length > 0 
                ? `Will sync to ${eventsFromSelectedDate.length} events from ${format(selectedDate, "MMM d, yyyy")} onwards`
                : `No events found from ${format(selectedDate, "MMM d, yyyy")} onwards`
              }
            </p>
            
            <Button 
              onClick={handleSyncFromDate}
              className="w-full"
              variant="outline"
              disabled={eventsFromSelectedDate.length === 0}
            >
              Sync {eventsFromSelectedDate.length} Events from Date
            </Button>
          </div>

          {/* Event breakdown info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <div className="flex justify-between">
              <span>Before {format(selectedDate, "MMM d")}: {eventsBeforeSelectedDate.length}</span>
              <span>From {format(selectedDate, "MMM d")}: {eventsFromSelectedDate.length}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}