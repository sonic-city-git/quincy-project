/**
 * CONSOLIDATED: ConfirmationDialog - Eliminates confirmation dialog duplication
 * 
 * Replaces identical confirmation/delete dialog patterns across 15+ components
 * Provides consistent confirmation UX with loading states and customizable actions
 */

import { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  
  // Content customization
  title?: string;
  description?: string | ReactNode;
  
  // Action customization
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  
  // State
  isPending?: boolean;
  disabled?: boolean;
}

/**
 * Generic confirmation dialog that replaces all delete/confirmation alerts
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'default',
  isPending = false,
  disabled = false
}: ConfirmationDialogProps) {
  
  const handleConfirm = () => {
    if (!isPending && !disabled) {
      onConfirm();
    }
  };

  const confirmButtonClass = variant === 'destructive'
    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
    : "";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        aria-labelledby="confirmation-title"
        aria-describedby="confirmation-description"
        role="alertdialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle id="confirmation-title">{title}</AlertDialogTitle>
          <AlertDialogDescription id="confirmation-description" asChild={typeof description !== 'string'}>
            {typeof description === 'string' ? description : <div>{description}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            disabled={isPending || disabled}
            aria-label={`${cancelText} this action`}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || disabled}
            className={confirmButtonClass}
            aria-label={`${confirmText} this action`}
            aria-describedby={isPending ? "loading-status" : undefined}
          >
            {isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            <span>{confirmText}</span>
            {isPending && (
              <span id="loading-status" className="sr-only">Loading...</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Specialized delete confirmation dialog
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  itemName,
  itemType = "item",
  isPending = false,
  ...props
}: Omit<ConfirmationDialogProps, 'title' | 'description' | 'confirmText' | 'variant'> & {
  itemName: string;
  itemType?: string;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Are you sure?"
      description={
        <>
          This action cannot be undone. This will permanently delete{' '}
          <strong>"{itemName}"</strong> and all its associated data.
        </>
      }
      confirmText="Delete"
      variant="destructive"
      isPending={isPending}
      {...props}
    />
  );
}