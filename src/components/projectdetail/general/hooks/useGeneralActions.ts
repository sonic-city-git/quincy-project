/**
 * CONSOLIDATED: useProjectTabActions - Eliminates action state duplication
 * 
 * Replaces repeated action state patterns across project tabs
 * Provides standardized dialog/action management for all project tabs
 */

import { useState } from 'react';

export interface TabAction {
  name: string;
  isActive: boolean;
  setActive: (active: boolean) => void;
  toggle: () => void;
}

export interface ProjectTabActionsResult {
  actions: Record<string, TabAction>;
  addAction: (name: string) => TabAction;
  getAction: (name: string) => TabAction | undefined;
  resetAll: () => void;
}

/**
 * Generic hook for managing tab actions (dialogs, menus, etc.)
 */
export function useProjectTabActions(
  initialActions: string[] = []
): ProjectTabActionsResult {
  const [actionStates, setActionStates] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    initialActions.forEach(action => {
      initial[action] = false;
    });
    return initial;
  });

  const setActionState = (name: string, active: boolean) => {
    setActionStates(prev => ({
      ...prev,
      [name]: active
    }));
  };

  const addAction = (name: string): TabAction => {
    // Initialize if not exists
    if (!(name in actionStates)) {
      setActionStates(prev => ({
        ...prev,
        [name]: false
      }));
    }

    return {
      name,
      isActive: actionStates[name] || false,
      setActive: (active: boolean) => setActionState(name, active),
      toggle: () => setActionState(name, !actionStates[name])
    };
  };

  const getAction = (name: string): TabAction | undefined => {
    if (!(name in actionStates)) return undefined;
    return addAction(name);
  };

  const resetAll = () => {
    setActionStates(prev => {
      const reset: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => {
        reset[key] = false;
      });
      return reset;
    });
  };

  // Create actions object
  const actions: Record<string, TabAction> = {};
  Object.keys(actionStates).forEach(name => {
    actions[name] = addAction(name);
  });

  return {
    actions,
    addAction,
    getAction,
    resetAll
  };
}

/**
 * Specialized hook for common project tab actions
 */
export function useCommonProjectTabActions() {
  const { actions, addAction } = useProjectTabActions([
    'addDialog',
    'editDialog', 
    'deleteDialog',
    'settingsDialog'
  ]);

  return {
    // Common action shortcuts
    addDialog: actions.addDialog,
    editDialog: actions.editDialog,
    deleteDialog: actions.deleteDialog,
    settingsDialog: actions.settingsDialog,
    
    // Custom action creator
    addCustomAction: addAction
  };
}