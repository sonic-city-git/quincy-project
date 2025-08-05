// Edit Variant Dialog Component
// Form dialog for editing existing project variants

import { useState, useEffect } from 'react';
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
import { ProjectVariant, UpdateVariantPayload, VARIANT_CONSTANTS } from '@/types/variants';
import { Loader2 } from 'lucide-react';

const editVariantSchema = z.object({
  display_name: z.string()
    .min(1, 'Display name is required')
    .max(VARIANT_CONSTANTS.MAX_DISPLAY_NAME_LENGTH, `Display name must be ${VARIANT_CONSTANTS.MAX_DISPLAY_NAME_LENGTH} characters or less`),
  description: z.string().optional(),
  is_default: z.boolean().default(false),
});

type EditVariantForm = z.infer<typeof editVariantSchema>;

interface EditVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ProjectVariant;
  onUpdateVariant: (data: UpdateVariantPayload) => Promise<void>;
  existingVariants: ProjectVariant[];
}

export function EditVariantDialog({
  open,
  onOpenChange,
  variant,
  onUpdateVariant,
  existingVariants
}: EditVariantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditVariantForm>({
    resolver: zodResolver(editVariantSchema),
    defaultValues: {
      display_name: variant.display_name,
      description: variant.description || '',
      is_default: variant.is_default,
    },
  });

  // Reset form when variant changes
  useEffect(() => {
    form.reset({
      display_name: variant.display_name,
      description: variant.description || '',
      is_default: variant.is_default,
    });
  }, [variant, form]);

  const hasOtherVariants = existingVariants.length > 1;
  const isCurrentlyDefault = variant.is_default;

  const onSubmit = async (data: EditVariantForm) => {
    setIsSubmitting(true);
    try {
      await onUpdateVariant({
        id: variant.id,
        display_name: data.display_name,
        description: data.description || undefined,
        is_default: data.is_default,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating variant:', error);
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
          <DialogTitle>Edit Variant</DialogTitle>
          <DialogDescription>
            Update the configuration for "{variant.display_name}" variant.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Trio, Band, DJ Set"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A human-readable name for this variant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show variant name as read-only */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-muted-foreground">
                Variant Name
              </label>
              <div className="px-3 py-2 text-sm bg-muted rounded-md font-mono">
                {variant.variant_name}
              </div>
              <p className="text-xs text-muted-foreground">
                Variant names cannot be changed after creation
              </p>
            </div>

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
                      {isCurrentlyDefault 
                        ? "This is currently the default variant"
                        : "Make this the default variant for new events"
                      }
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!hasOtherVariants && isCurrentlyDefault} // Can't unset default if it's the only variant
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!hasOtherVariants && isCurrentlyDefault && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>Note:</strong> This variant must remain the default since it's the only variant. Create another variant first if you want to change the default.
              </div>
            )}

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
                Update Variant
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}