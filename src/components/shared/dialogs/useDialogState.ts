/**
 * CONSOLIDATED: useDialogState - Eliminates dialog state duplication
 * 
 * Replaces identical state management patterns across 25+ dialog components
 * Provides consistent external/internal state control for all dialogs
 */

import { useState } from 'react';

export interface DialogStateProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface DialogStateResult {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleOpenChange: (open: boolean) => void;
}

/**
 * Unified dialog state management hook
 * Handles both external control and internal state patterns
 */
export function useDialogState({ 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
}: DialogStateProps = {}): DialogStateResult {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Always use internal state, but sync with external control
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    if (externalOnOpenChange) {
      externalOnOpenChange(newOpen);
    }
  };

  // Unified handler that works for both controlled and uncontrolled
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return {
    open,
    setOpen,
    handleOpenChange
  };
}

/**
 * Specialized hook for dialogs that need reset on close
 */
export function useDialogStateWithReset({ 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  onReset
}: DialogStateProps & { onReset?: () => void } = {}): DialogStateResult {
  const { open, setOpen, handleOpenChange } = useDialogState({ 
    open: externalOpen, 
    onOpenChange: externalOnOpenChange 
  });

  const handleOpenChangeWithReset = (newOpen: boolean) => {
    if (!newOpen && onReset) {
      onReset();
    }
    handleOpenChange(newOpen);
  };

  return {
    open,
    setOpen,
    handleOpenChange: handleOpenChangeWithReset
  };
}