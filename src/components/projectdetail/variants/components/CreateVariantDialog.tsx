// Create Variant Dialog Component
// Form dialog for creating new project variants

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
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ProjectVariant, CreateVariantPayload, VARIANT_CONSTANTS } from '@/types/variants';
import { Loader2 } from 'lucide-react';

const createVariantSchema = z.object({
  variant_name: z.string()
    .min(1, 'Variant name is required')
    .max(VARIANT_CONSTANTS.MAX_VARIANT_NAME_LENGTH, `Variant name must be ${VARIANT_CONSTANTS.MAX_VARIANT_NAME_LENGTH} characters or less`),
  description: z.string().optional(),
  is_default: z.boolean().default(false),
});

type CreateVariantForm = z.infer<typeof createVariantSchema>;

interface CreateVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateVariant: (data: CreateVariantPayload) => Promise<void>;
  existingVariants: ProjectVariant[];
}

export function CreateVariantDialog({
  open,
  onOpenChange,
  onCreateVariant,
  existingVariants
}: CreateVariantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateVariantForm>({
    resolver: zodResolver(createVariantSchema),
    defaultValues: {
      variant_name: '',
      description: '',
      is_default: existingVariants.length === 0, // First variant should be default
    },
  });

  const existingVariantNames = existingVariants.map(v => v.variant_name);

  const onSubmit = async (data: CreateVariantForm) => {
    setIsSubmitting(true);
    try {
      // Check if variant name already exists
      if (existingVariantNames.includes(data.variant_name)) {
        form.setError('variant_name', { message: 'This variant name already exists' });
        return;
      }

      await onCreateVariant({
        variant_name: data.variant_name,
        description: data.description || undefined,
        is_default: data.is_default,
      });

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating variant:', error);
      // Error is handled by the parent component with toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Variant</DialogTitle>
          <DialogDescription>
            Create a new configuration variant for this project. Variants help organize different setups like "Trio", "Band", or "DJ" configurations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="variant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Trio, Band, DJ Set"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A name for this variant (e.g., "Trio", "Band", "DJ Set")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this variant..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description to help identify this variant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Default Variant</FormLabel>
                    <FormDescription>
                      Make this the default variant for new events
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={existingVariants.length === 0} // First variant must be default
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
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
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Variant
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}