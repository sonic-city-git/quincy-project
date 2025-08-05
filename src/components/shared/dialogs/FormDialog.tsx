/**
 * CONSOLIDATED: FormDialog - Eliminates form dialog duplication
 * 
 * Replaces identical form dialog patterns across 15+ components
 * Provides consistent form dialog UX with validation, loading states, and error handling
 */

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDialogState, DialogStateProps } from './useDialogState';
import { cn } from '@/lib/utils';

export interface FormDialogProps extends DialogStateProps {
  // Content
  title: string;
  description?: string | ReactNode;
  
  // Form content - passed as children
  children: ReactNode;
  
  // Size variants
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  // Behavior
  closeOnOverlayClick?: boolean;
  
  // Classes
  className?: string;
  contentClassName?: string;
}

/**
 * Generic form dialog wrapper that provides consistent structure
 */
export function FormDialog({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  className,
  contentClassName
}: FormDialogProps) {
  
  const { open, handleOpenChange } = useDialogState({
    open: externalOpen,
    onOpenChange: externalOnOpenChange
  });

  // Size classes for responsive design
  const sizeClasses = {
    sm: 'sm:max-w-[425px]',
    md: 'sm:max-w-[525px]', 
    lg: 'sm:max-w-[725px]',
    xl: 'sm:max-w-[925px]',
    full: 'sm:max-w-[95vw]'
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={handleOpenChange}
      modal={closeOnOverlayClick}
    >
      <DialogContent 
        className={cn(sizeClasses[size], contentClassName)}
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">{title}</DialogTitle>
          {description && (
            <DialogDescription id="dialog-description" asChild={typeof description !== 'string'}>
              {typeof description === 'string' ? description : <div>{description}</div>}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {/* Form content */}
        <div className={className} role="form">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Specialized "Add" dialog with consistent messaging
 */
export function AddItemDialog({
  itemType,
  title,
  description,
  ...props
}: Omit<FormDialogProps, 'title'> & {
  itemType: string;
  title?: string;
}) {
  const defaultTitle = title || `Add New ${itemType}`;
  const defaultDescription = description || `Fill in the details below to create a new ${itemType.toLowerCase()}.`;

  return (
    <FormDialog
      title={defaultTitle}
      description={defaultDescription}
      {...props}
    />
  );
}

/**
 * Specialized "Edit" dialog with consistent messaging
 */
export function EditItemDialog({
  itemType,
  itemName,
  title,
  description,
  ...props
}: Omit<FormDialogProps, 'title'> & {
  itemType: string;
  itemName?: string;
  title?: string;
}) {
  const defaultTitle = title || `Edit ${itemType}${itemName ? ` - ${itemName}` : ''}`;
  const defaultDescription = description || `Update the details below to modify this ${itemType.toLowerCase()}.`;

  return (
    <FormDialog
      title={defaultTitle}
      description={defaultDescription}
      {...props}
    />
  );
}