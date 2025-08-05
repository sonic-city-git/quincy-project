// Duplicate Variant Dialog Component
// Form dialog for duplicating existing project variants with all their resources

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
import { ProjectVariant, CreateVariantPayload, VARIANT_CONSTANTS, generateVariantName } from '@/types/variants';
import { Loader2, Copy } from 'lucide-react';

const duplicateVariantSchema = z.object({
  display_name: z.string()
    .min(1, 'Display name is required')
    .max(VARIANT_CONSTANTS.MAX_DISPLAY_NAME_LENGTH, `Display name must be ${VARIANT_CONSTANTS.MAX_DISPLAY_NAME_LENGTH} characters or less`),
  variant_name: z.string()
    .min(1, 'Variant name is required')
    .max(VARIANT_CONSTANTS.MAX_VARIANT_NAME_LENGTH, `Variant name must be ${VARIANT_CONSTANTS.MAX_VARIANT_NAME_LENGTH} characters or less`)
    .regex(VARIANT_CONSTANTS.VALID_VARIANT_NAME_PATTERN, 'Variant name can only contain lowercase letters, numbers, and underscores'),
  description: z.string().optional(),
  is_default: z.boolean().default(false),
});

type DuplicateVariantForm = z.infer<typeof duplicateVariantSchema>;

interface DuplicateVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceVariant: ProjectVariant;
  onDuplicateVariant: (data: CreateVariantPayload) => Promise<void>;
  existingVariants: ProjectVariant[];
}

export function DuplicateVariantDialog({
  open,
  onOpenChange,
  sourceVariant,
  onDuplicateVariant,
  existingVariants
}: DuplicateVariantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingVariantNames = existingVariants.map(v => v.variant_name);
  
  // Generate initial duplicate name
  const suggestedDisplayName = `${sourceVariant.display_name} Copy`;
  const suggestedVariantName = generateVariantName(suggestedDisplayName);
  
  const form = useForm<DuplicateVariantForm>({
    resolver: zodResolver(duplicateVariantSchema),
    defaultValues: {
      display_name: suggestedDisplayName,
      variant_name: ensureUniqueVariantName(suggestedVariantName, existingVariantNames),
      description: sourceVariant.description ? `Copy of: ${sourceVariant.description}` : '',
      is_default: false, // Duplicates should not be default by default
    },
  });

  function ensureUniqueVariantName(baseName: string, existing: string[]): string {
    let uniqueName = baseName;
    let counter = 1;

    while (existing.includes(uniqueName)) {
      uniqueName = `${baseName}_${counter}`;
      counter++;
    }

    return uniqueName;
  }

  // Auto-generate variant name from display name
  const handleDisplayNameChange = (displayName: string) => {
    const generatedName = generateVariantName(displayName);
    const uniqueName = ensureUniqueVariantName(generatedName, existingVariantNames);
    form.setValue('variant_name', uniqueName);
  };

  const onSubmit = async (data: DuplicateVariantForm) => {
    setIsSubmitting(true);
    try {
      // Validate unique variant name
      if (existingVariantNames.includes(data.variant_name)) {
        form.setError('variant_name', { message: 'This variant name already exists' });
        return;
      }

      await onDuplicateVariant({
        variant_name: data.variant_name,
        display_name: data.display_name,
        description: data.description || undefined,
        is_default: data.is_default,
      });

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error duplicating variant:', error);
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
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Variant
          </DialogTitle>
          <DialogDescription>
            Create a copy of <strong>"{sourceVariant.display_name}"</strong> with all its crew roles and equipment. You can then modify the copy as needed.
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
                      placeholder="e.g., Trio Copy, Band Extended"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleDisplayNameChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    A human-readable name for the duplicated variant
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="variant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., trio_copy, band_extended"
                      {...field}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    A unique identifier (lowercase, numbers, underscores only)
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
                      Make this duplicated variant the default for new events
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Info about what gets copied */}
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <div className="font-medium mb-1">What gets copied:</div>
              <ul className="text-muted-foreground space-y-0.5 text-xs">
                <li>• All crew roles and their rates</li>
                <li>• All equipment items and quantities</li>
                <li>• Equipment groups and organization</li>
                <li>• Notes and preferences</li>
              </ul>
            </div>

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
                Duplicate Variant
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}