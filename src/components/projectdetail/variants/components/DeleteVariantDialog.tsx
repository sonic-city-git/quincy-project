// Delete Variant Dialog Component
// Confirmation dialog for deleting project variants

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProjectVariant } from '@/types/variants';
import { Loader2, AlertTriangle } from 'lucide-react';
import { FORM_PATTERNS, cn } from '@/design-system';

interface DeleteVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: ProjectVariant;
  onDeleteVariant: () => Promise<void>;
  canDelete: boolean;
}

export function DeleteVariantDialog({
  open,
  onOpenChange,
  variant,
  onDeleteVariant,
  canDelete
}: DeleteVariantDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      await onDeleteVariant();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the parent component with toast
      // No need to log here as parent handles error reporting
    } finally {
      setIsDeleting(false);
    }
  };

  const getRestrictionReason = () => {
    if (variant.is_default) {
      return "Cannot delete the default variant. Make another variant the default first.";
    }
    return "Cannot delete the only remaining variant. Create another variant first.";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={FORM_PATTERNS.dialog.container}>
        <AlertDialogHeader className={FORM_PATTERNS.dialog.header}>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Variant
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {canDelete ? (
              <>
                <p>
                  Are you sure you want to delete the <strong>"{variant.variant_name}"</strong> variant?
                </p>
                <p className="text-sm">
                  This action will permanently remove the variant and all its associated crew roles and equipment configurations. This action cannot be undone.
                </p>
              </>
            ) : (
              <>
                <p>
                  The <strong>"{variant.variant_name}"</strong> variant cannot be deleted.
                </p>
                <p className="text-sm text-muted-foreground">
                  {getRestrictionReason()}
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className={FORM_PATTERNS.dialog.footer}>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          
          {canDelete && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              aria-label={`Delete ${variant.variant_name} variant`}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Variant
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}