/**
 * CONSOLIDATED: EventFormDialog - Eliminates Event dialog duplication
 * 
 * Replaces massive duplication between AddEventDialog (115 lines) and EventManagementDialog (368 lines)
 * Provides unified event form with consistent validation, state management, and UX
 */

import { ReactNode, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarEvent, EventType } from "@/types/events";
import { ConfirmationDialog } from "../dialogs/ConfirmationDialog";
import { LocationInput } from "../../calendar/LocationInput";

export interface EventFormData {
  name: string;
  typeId: string;
  status: CalendarEvent['status'];
  location: string;
}

export interface EventFormDialogProps {
  // Basic dialog props
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Mode configuration
  mode: 'add' | 'edit';
  title?: string;
  description?: string;
  
  // Event data
  event?: CalendarEvent | null;
  selectedDate?: Date;
  eventTypes: EventType[];
  
  // Form configuration
  defaultStatus?: CalendarEvent['status'];
  requiredNameTypes?: string[]; // Event types that require custom names
  
  // Actions
  onSubmit: (data: EventFormData) => Promise<void>;
  onDelete?: (event: CalendarEvent) => Promise<void>;
  
  // Additional content
  additionalSections?: ReactNode;
  
  // Loading states
  isSubmitting?: boolean;
  isDeleting?: boolean;
}

/**
 * Unified event form dialog that handles both Add and Edit modes
 */
export function EventFormDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  event,
  selectedDate,
  eventTypes,
  defaultStatus = 'proposed',
  requiredNameTypes = ['Show', 'Double Show'],
  onSubmit,
  onDelete,
  additionalSections,
  isSubmitting = false,
  isDeleting = false
}: EventFormDialogProps) {
  
  // Form state
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    typeId: '',
    status: defaultStatus,
    location: ''
  });
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && event) {
        setFormData({
          name: event.name || '',
          typeId: event.type.id,
          status: event.status,
          location: event.location || ''
        });
      } else {
        setFormData({
          name: '',
          typeId: '',
          status: defaultStatus,
          location: ''
        });
      }
    }
  }, [open, mode, event, defaultStatus]);

  // Get current event type and validation rules
  const selectedEventType = eventTypes.find(type => type.id === formData.typeId);
  const isNameRequired = selectedEventType && requiredNameTypes.includes(selectedEventType.name);
  const displayDate = mode === 'edit' ? event?.date : selectedDate;

  // Form handlers
  const updateFormData = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEventType) {
      toast.error("Please select an event type");
      return;
    }

    if (isNameRequired && !formData.name.trim()) {
      toast.error("Event name is required for this event type");
      return;
    }

    setIsPending(true);
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim() || selectedEventType.name
      });
      
      const action = mode === 'add' ? 'created' : 'updated';
      toast.success(`Event ${action} successfully`);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'creating' : 'updating'} event:`, error);
      toast.error(`Failed to ${mode === 'add' ? 'create' : 'update'} event`);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    
    try {
      await onDelete(event);
      toast.success("Event deleted successfully");
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error("Failed to delete event");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleClose = () => {
    if (isPending || isSubmitting) return;
    onOpenChange(false);
  };

  // Auto-generate titles
  const dialogTitle = title || (mode === 'add' ? 'Add New Event' : 'Edit Event');
  const dialogDescription = description || (
    mode === 'add' 
      ? `Create a new event for ${displayDate ? format(displayDate, 'EEEE, MMMM d, yyyy') : 'selected date'}`
      : 'Make changes to your event here. Click save when you\'re done.'
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Details Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Event Details</h2>
                  {displayDate && (
                    <p className="text-sm text-muted-foreground">
                      {format(displayDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => updateFormData('status', value as CalendarEvent['status'])}
                  >
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
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder={selectedEventType?.name || "Enter event name"}
                    required={isNameRequired}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Event Type
                  </label>
                  <Select 
                    value={formData.typeId} 
                    onValueChange={(value) => updateFormData('typeId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
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
                  value={formData.location}
                  onChange={(value) => updateFormData('location', value)}
                />
              </div>
            </div>

            {/* Additional sections (crew, equipment, etc.) */}
            {additionalSections}

            {/* Form Actions */}
            <div className="flex justify-between pt-4">
              <div>
                {mode === 'edit' && onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isPending || isSubmitting || isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={isPending || isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isPending || isSubmitting || !formData.typeId}
                >
                  {(isPending || isSubmitting) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {mode === 'add' ? 'Create Event' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      {mode === 'edit' && onDelete && (
        <ConfirmationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDelete}
          title="Delete Event"
          description={
            <>
              Are you sure you want to delete this event? This action cannot be undone.
              <br />
              <strong>"{event?.name || 'Untitled Event'}"</strong>
            </>
          }
          confirmText="Delete Event"
          variant="destructive"
          isPending={isDeleting}
        />
      )}
    </>
  );
}