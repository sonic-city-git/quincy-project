// Edit Variant Dialog Component
// Form dialog for editing existing project variants

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { FormDialog } from '@/components/shared/dialogs/FormDialog';
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

import { ProjectVariant, UpdateVariantPayload, VARIANT_CONSTANTS } from '@/types/variants';
import { Loader2 } from 'lucide-react';

const editVariantSchema = z.object({
  variant_name: z.string()
    .min(1, 'Variant name is required')
    .max(VARIANT_CONSTANTS.MAX_VARIANT_NAME_LENGTH, `Variant name must be ${VARIANT_CONSTANTS.MAX_VARIANT_NAME_LENGTH} characters or less`),
  description: z.string().optional(),
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
      variant_name: variant.variant_name,
      description: variant.description || '',
    },
  });

  // Reset form when variant changes
  useEffect(() => {
    form.reset({
      variant_name: variant.variant_name,
      description: variant.description || '',
    });
  }, [variant, form]);



  const onSubmit = async (data: EditVariantForm) => {
    setIsSubmitting(true);
    try {
      await onUpdateVariant({
        id: variant.id,
        variant_name: data.variant_name,
        description: data.description || undefined,
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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Variant"
      description={`Update the configuration for "${variant.variant_name}" variant.`}
      size="sm"
    >
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
                    A human-readable name for this variant
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
    </FormDialog>
  );
}