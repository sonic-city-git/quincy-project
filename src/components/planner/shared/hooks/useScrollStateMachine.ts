/**
 * Scroll State Machine - Proper coordination of all timeline scroll operations
 * 
 * This coordinates 5 different scroll systems:
 * 1. Date centering (smooth animation)
 * 2. Drag operations (real-time manual)
 * 3. Header sync (instant manual)
 * 4. Timeline expansion (precise positioning)
 * 5. Navigation (smooth animation)
 */

import { useRef, useCallback } from 'react';

export type ScrollOperation = 'idle' | 'centering' | 'dragging' | 'syncing' | 'expanding' | 'navigating';

interface ScrollState {
  operation: ScrollOperation;
  startTime: number;
  timeoutId?: NodeJS.Timeout;
}

interface ScrollCoordinator {
  // State queries
  canStartSmooth: () => boolean;
  canStartManual: () => boolean;
  isOperationActive: (operation: ScrollOperation) => boolean;
  
  // State management
  startOperation: (operation: ScrollOperation, duration?: number) => boolean;
  endOperation: (operation: ScrollOperation) => void;
  forceEnd: () => void;
  
  // Scroll execution
  executeSmooth: (container: HTMLElement, scrollLeft: number) => void;
  executeManual: (container: HTMLElement, scrollLeft: number) => void;
  
  // Current state
  getCurrentOperation: () => ScrollOperation;
}

export function useScrollStateMachine(): ScrollCoordinator {
  const stateRef = useRef<ScrollState>({
    operation: 'idle',
    startTime: 0,
  });

  // Clear any active timeout
  const clearTimeout = useCallback(() => {
    if (stateRef.current.timeoutId) {
      clearTimeout(stateRef.current.timeoutId);
      stateRef.current.timeoutId = undefined;
    }
  }, []);

  // State queries
  const canStartSmooth = useCallback((): boolean => {
    const { operation } = stateRef.current;
    // Smooth operations can only start when idle or replacing another smooth operation
    return operation === 'idle' || operation === 'centering' || operation === 'navigating';
  }, []);

  const canStartManual = useCallback((): boolean => {
    // Manual operations (drag, sync) can always start - they have priority
    return true;
  }, []);

  const isOperationActive = useCallback((operation: ScrollOperation): boolean => {
    return stateRef.current.operation === operation;
  }, []);

  // State management
  const startOperation = useCallback((operation: ScrollOperation, duration = 500): boolean => {
    const canStart = operation === 'dragging' || operation === 'syncing' ? 
      canStartManual() : canStartSmooth();
    
    if (!canStart) return false;

    // Clear any existing timeout
    clearTimeout();

    // Set new state
    stateRef.current = {
      operation,
      startTime: performance.now(),
    };

    // Auto-end after duration (except for persistent operations)
    if (operation !== 'dragging' && operation !== 'syncing') {
      stateRef.current.timeoutId = setTimeout(() => {
        if (stateRef.current.operation === operation) {
          stateRef.current.operation = 'idle';
        }
      }, duration);
    }

    return true;
  }, [canStartManual, canStartSmooth, clearTimeout]);

  const endOperation = useCallback((operation: ScrollOperation) => {
    if (stateRef.current.operation === operation) {
      clearTimeout();
      stateRef.current.operation = 'idle';
    }
  }, [clearTimeout]);

  const forceEnd = useCallback(() => {
    clearTimeout();
    stateRef.current.operation = 'idle';
  }, [clearTimeout]);

  // Scroll execution with state machine integration
  const executeSmooth = useCallback((container: HTMLElement, scrollLeft: number) => {
    if (!canStartSmooth()) {
      console.warn('Cannot start smooth scroll - blocked by:', stateRef.current.operation);
      return;
    }

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  }, [canStartSmooth]);

  const executeManual = useCallback((container: HTMLElement, scrollLeft: number) => {
    // Manual operations always execute immediately
    container.scrollLeft = scrollLeft;
  }, []);

  const getCurrentOperation = useCallback((): ScrollOperation => {
    return stateRef.current.operation;
  }, []);

  return {
    canStartSmooth,
    canStartManual,
    isOperationActive,
    startOperation,
    endOperation,
    forceEnd,
    executeSmooth,
    executeManual,
    getCurrentOperation,
  };
}