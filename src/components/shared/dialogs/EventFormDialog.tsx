/**
 * Event Form Dialog - Clean, design system compliant form for adding/editing events
 * Uses React Hook Form with Zod validation following project design patterns
 */

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getRandomLegendaryFestival } from '@/design-system';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { CalendarEvent, EventType } from "@/types/events";
import { ConfirmationDialog } from "@/components/shared/dialogs/ConfirmationDialog";
import { VariantSelector } from "@/components/shared/forms/VariantSelector";
import { CityLocationInput } from "@/components/shared/forms/CityLocationInput";

// Form validation schema
const eventFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  typeId: z.string()
    .min(1, 'Type is required'),
  status: z.enum(['proposed', 'confirmed', 'invoice ready', 'cancelled']),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be 200 characters or less'),
  variantName: z.string()
    .min(1, 'Variant is required'),
});

type EventFormData = z.infer<typeof eventFormSchema>;

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
  projectId: string;
  
  // Form configuration
  defaultStatus?: CalendarEvent['status'];
  
  // Actions
  onSubmit: (data: EventFormData, locationData?: any) => Promise<void>;
  onDelete?: (event: CalendarEvent) => Promise<void>;
}

export function EventFormDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  event,
  selectedDate,
  eventTypes,
  projectId,
  defaultStatus = 'proposed',
  onSubmit,
  onDelete
}: EventFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [randomFestivalPlaceholder, setRandomFestivalPlaceholder] = useState(getRandomLegendaryFestival());
  const [selectedLocationData, setSelectedLocationData] = useState<any>(null);

  // Form setup
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: '',
      typeId: '',
      status: defaultStatus,
      location: '',
      variantName: 'default'
    },
  });

  // Get selected event type
  const selectedTypeId = form.watch('typeId');
  const selectedEventType = eventTypes.find(type => type.id === selectedTypeId);

  // Reset form when dialog opens/closes or event changes
  useEffect(() => {
    if (open) {
      // Get a new random festival placeholder each time dialog opens
      setRandomFestivalPlaceholder(getRandomLegendaryFestival());
      
      if (mode === 'edit' && event) {
        form.reset({
          name: event.name || '',
          typeId: event.type.id,
          status: event.status,
          location: event.location || '',
          variantName: event.variant_name || 'default'
        });
      } else {
        form.reset({
          name: '',
          typeId: '',
          status: defaultStatus,
          location: '',
          variantName: 'default'
        });
      }
    }
  }, [open, mode, event, defaultStatus, form]);

  // Handle form submission
  const handleSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      // Pass both form data and structured location data
      await onSubmit(data, selectedLocationData);
      form.reset();
      setSelectedLocationData(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!event || !onDelete) return;
    
    setIsSubmitting(true);
    try {
      await onDelete(event);
      setShowDeleteDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dialog titles and descriptions
  const dialogTitle = title || (mode === 'edit' ? 'Edit Event' : 'Add New Event');
  const dialogDescription = description || (
    mode === 'edit' 
      ? `Update the details for this ${selectedDate ? format(selectedDate, 'MMMM d') : ''} event.`
      : `Create a new event${selectedDate ? ` for ${format(selectedDate, 'EEEE, MMMM d, yyyy')}` : ''}.`
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {dialogTitle}
            </DialogTitle>
            <DialogDescription>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              
              {/* Type */}
              <FormField
                control={form.control}
                name="typeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={randomFestivalPlaceholder}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="proposed">Proposed</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="invoice ready">Invoice Ready</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variant Selection */}
              <FormField
                control={form.control}
                name="variantName"
                render={({ field }) => (
                  <FormItem>
                    <VariantSelector
                      projectId={projectId}
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                      showLabel={true}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <CityLocationInput
                        value={field.value || ''}
                        onChange={(displayName, cityData) => {
                          field.onChange(displayName);
                          // Store structured city data for analytics
                          setSelectedLocationData(cityData);
                          if (cityData) {
                            console.log('City selected with structured data:', cityData);
                          }
                        }}
                        placeholder="Search for a city"
                        error={form.formState.errors.location?.message}
                        required={true}
                        showLabel={true}
                        description=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  {mode === 'edit' && onDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isSubmitting}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {mode === 'edit' ? 'Update Event' : 'Create Event'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete Event"
        cancelText="Cancel"
        variant="destructive"
        loading={isSubmitting}
      />
    </>
  );
}