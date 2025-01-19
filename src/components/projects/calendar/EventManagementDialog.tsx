import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CalendarEvent, EventType } from "@/types/events";
import { useState, useEffect } from "react";
import { useEventTypes } from "@/hooks/useEventTypes";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import { useSyncCrewStatus } from "@/hooks/useSyncCrewStatus";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCrew } from "@/hooks/useCrew";
import { CrewMemberSelectContent } from "@/components/crew/CrewMemberSelectContent";
import { LocationInput } from "./LocationInput";
import { EquipmentIcon } from "./components/EquipmentIcon";
import { Separator } from "@/components/ui/separator";

interface EventManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  onUpdateEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
}

export function EventManagementDialog({
  isOpen,
  onClose,
  event,
  onUpdateEvent,
  onDeleteEvent,
}: EventManagementDialogProps) {
  const { data: eventTypes = [] } = useEventTypes();
  const queryClient = useQueryClient();
  const [name, setName] = useState(event?.name || "");
  const [selectedType, setSelectedType] = useState<string>(event?.type.id || "");
  const [status, setStatus] = useState<CalendarEvent['status']>(event?.status || 'proposed');
  const [location, setLocation] = useState(event?.location || "");
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { crew = [] } = useCrew();
  const { isSynced: isEquipmentSynced, isChecking: isCheckingEquipment, hasProjectEquipment } = useSyncStatus(event);
  const { hasProjectRoles, roles = [], isChecking: isCheckingCrew } = useSyncCrewStatus(event);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && event) {
      setName(event.name);
      setSelectedType(event.type.id);
      setStatus(event.status);
      setLocation(event.location || "");
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    const eventType = eventTypes.find((type) => type.id === selectedType);
    if (!eventType) {
      toast.error("Please select an event type");
      return;
    }

    try {
      if (onUpdateEvent) {
        await onUpdateEvent({
          ...event,
          name: name.trim() || eventType.name,
          type: eventType,
          status,
          location,
        });
        toast.success("Event updated successfully");
      }

      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error("Failed to save event");
    }
  };

  const handleDelete = async () => {
    if (event && onDeleteEvent) {
      try {
        await onDeleteEvent(event);
        toast.success("Event deleted successfully");
        onClose();
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error("Failed to delete event");
      }
    }
  };

  const handleAssignCrew = async (roleId: string, crewMemberId: string | null) => {
    if (!event) return;
    setIsPending(true);

    try {
      if (!crewMemberId) {
        // Delete the role assignment if "None" is selected
        const { error } = await supabase
          .from('project_event_roles')
          .delete()
          .match({
            project_id: event.project_id,
            event_id: event.id,
            role_id: roleId
          });

        if (error) throw error;
      } else {
        // Update or insert the role assignment
        const { error } = await supabase
          .from('project_event_roles')
          .upsert({
            project_id: event.project_id,
            event_id: event.id,
            role_id: roleId,
            crew_member_id: crewMemberId
          });

        if (error) throw error;
      }

      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['events', event.project_id]
        }),
        queryClient.invalidateQueries({
          queryKey: ['crew-sync-status', event.id]
        })
      ]);

      toast.success("Crew member assignment updated");
    } catch (error: any) {
      console.error("Error assigning crew member:", error);
      toast.error(error.message || "Failed to assign crew member");
    } finally {
      setIsPending(false);
    }
  };

  if (!event) return null;

  const selectedEventType = eventTypes.find(type => type.id === selectedType);
  const isNameRequired = selectedEventType?.name === 'Show' || selectedEventType?.name === 'Double Show';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Details Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Event Details</h2>
                  <p className="text-sm text-muted-foreground">
                    {format(event.date, 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={status} onValueChange={(value) => setStatus(value as CalendarEvent['status'])}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proposed">Proposed</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="invoice ready">Invoice Ready</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Event Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter event name"
                    required={isNameRequired}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Event Type
                  </label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <LocationInput
                  value={location}
                  onChange={setLocation}
                />
              </div>
            </div>

            <Separator />

            {/* Crew Section */}
            {hasProjectRoles && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Crew Assignments</h2>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-4">
                    {roles.map(role => (
                      <div key={role.id} className="flex items-center gap-4">
                        <div 
                          className="w-24 px-2 py-1 rounded text-sm text-white text-center"
                          style={{ backgroundColor: role.color }}
                        >
                          {role.name}
                        </div>
                        <Select
                          value={role.assigned?.id || "_none"}
                          onValueChange={(value) => handleAssignCrew(role.id, value === "_none" ? null : value)}
                          disabled={isPending}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <CrewMemberSelectContent crew={crew} showNoneOption />
                        </Select>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <Separator />

            {/* Equipment Section */}
            {event.type.needs_equipment && hasProjectEquipment && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Equipment</h2>
                  <EquipmentIcon
                    isEditingDisabled={false}
                    isSynced={isEquipmentSynced}
                    isChecking={isCheckingEquipment}
                    eventId={event.id}
                    projectId={event.project_id}
                    hasProjectEquipment={hasProjectEquipment}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Event
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this event and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
