/**
 * Multi-Event Dialog - Clean, design system compliant form for bulk event creation
 * Uses React Hook Form with Zod validation following project design patterns
 */

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Copy } from "lucide-react";
import { CalendarEvent, EventType } from "@/types/events";
import { SimpleVariantSelector } from "@/components/shared/forms/SimpleVariantSelector";
import { useProjectVariants } from "@/hooks/useProjectVariants";

// Only allow specific event types for multi-event creation
const ALLOWED_EVENT_TYPES = [
  'Rehearsal', 'Concert', 'Gig', 'Festival', 'Recording', 
  'Meeting', 'Setup', 'Soundcheck', 'Photo Shoot'
];

// Form validation schema
const multiEventFormSchema = z.object({
  eventTypeId: z.string()
    .min(1, 'Type is required'),
  status: z.enum(['proposed', 'confirmed', 'invoice ready', 'cancelled']),
  variantName: z.string()
    .min(1, 'Variant is required'),
});

type MultiEventFormData = z.infer<typeof multiEventFormSchema>;

export interface MultiEventDialogProps {
  open: boolean;
  onClose: () => void;
  selectedDates: Date[];
  eventTypes: EventType[];
  projectId?: string;
  onAddEvents: (
    eventTypeName: string, 
    eventType: EventType, 
    status: CalendarEvent['status'],
    variantName: string
  ) => void;
}

export function MultiEventDialog({
  open,
  onClose,
  selectedDates,
  eventTypes,
  projectId,
  onAddEvents
}: MultiEventDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Preload variants - simple approach
  const { data: variants = [], isLoading: variantsLoading } = useProjectVariants(projectId);
  
  // Filter event types to only allowed ones
  const filteredEventTypes = eventTypes.filter(type => 
    ALLOWED_EVENT_TYPES.includes(type.name)
  );

  // Get intelligent default variant (fallback to first variant or 'default')
  const defaultVariant = variants.find(v => v.is_default)?.variant_name || 
                         variants[0]?.variant_name || 
                         'default';

  // Form setup
  const form = useForm<MultiEventFormData>({
    resolver: zodResolver(multiEventFormSchema),
    defaultValues: {
      eventTypeId: '',
      status: 'proposed',
      variantName: defaultVariant // Clean default, no flicker
    },
  });

  // Get selected event type
  const selectedEventTypeId = form.watch('eventTypeId');
  const selectedEventType = filteredEventTypes.find(type => type.id === selectedEventTypeId);

  // Handle form submission
  const handleSubmit = async (data: MultiEventFormData) => {
    if (!selectedEventType) return;

    setIsSubmitting(true);
    try {
      onAddEvents(selectedEventType.name, selectedEventType, data.status, data.variantName);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating events:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  // Don't render if no dates are selected
  if (!selectedDates?.length) {
    return null;
  }

  // Don't show dialog until variants are loaded (prevents flicker)
  if (variantsLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Add Events to Multiple Dates
          </DialogTitle>
          <DialogDescription>
            Create the same event across {selectedDates.length} selected dates. 
            Each event will use the same configuration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            {/* Type */}
            <FormField
              control={form.control}
              name="eventTypeId"
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
                      {filteredEventTypes.map((eventType) => (
                        <SelectItem key={eventType.id} value={eventType.id}>
                          {eventType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the type of event to create on all selected dates
                  </FormDescription>
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
                  <FormDescription>
                    All events will be created with this status
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variant Selection - Simple approach */}
            <FormField
              control={form.control}
              name="variantName"
              render={({ field }) => (
                <FormItem>
                  <SimpleVariantSelector
                    variants={variants}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting || variantsLoading}
                    showLabel={true}
                  />
                  <FormDescription>
                    All events will use this variant configuration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedEventType}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create {selectedDates.length} Events
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}