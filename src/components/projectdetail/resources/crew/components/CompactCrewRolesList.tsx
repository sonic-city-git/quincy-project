/**
 * Compact Crew Roles List - More condensed view for variant layout
 * Optimized for performance with memoized role items
 */

import { useVariantCrew } from "@/hooks/useVariantCrew";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useCallback, useMemo } from "react";
import React from "react";
import { toast } from "sonner";
import { useCrew } from "@/hooks/useCrew";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CrewMemberSelectContent } from "@/components/resources/crew/CrewMemberSelectContent";
import { getRoleBadgeStyle, cn } from "@/design-system";
import { VariantCrewRole } from "@/types/variants";

interface CompactCrewRolesListProps {
  projectId: string;
  variantName: string;
}

// Memoized individual role item component to prevent unnecessary re-renders
const MemoizedRoleItem = React.memo(({ 
  role, 
  crew, 
  rateInputValues,
  updatingRoles,
  onRateInputChange,
  onRateKeyDown,
  onRateFocus,
  onRateBlur,
  onPreferredChange,
  onDeleteRole
}: {
  role: VariantCrewRole;
  crew: any[];
  rateInputValues: { daily: string; hourly: string };
  updatingRoles: Set<string>;
  onRateInputChange: (roleId: string, field: 'daily' | 'hourly', value: string) => void;
  onRateKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, roleId: string, field: 'daily_rate' | 'hourly_rate') => void;
  onRateFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  onRateBlur: (roleId: string, field: 'daily_rate' | 'hourly_rate') => void;
  onPreferredChange: (roleId: string, value: string) => void;
  onDeleteRole: (roleId: string) => void;
}) => {
  const isUpdating = updatingRoles.has(role.id);
  
  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg transition-all duration-200 hover:bg-muted/30",
        "p-1.5 space-y-1.5",
        isUpdating && "ring-2 ring-primary/20"
      )}
    >
      {/* Role Badge + Delete Button Row */}
      <div className="flex items-center justify-between">
        <span 
          className="inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-medium"
          style={role.role?.name ? getRoleBadgeStyle(role.role.name) : {}}
        >
          {role.role?.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteRole(role.id)}
          className="h-6 w-6 p-0 transition-all duration-200 text-muted-foreground/60 hover:text-white hover:bg-destructive focus:bg-destructive focus:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Rates Row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-muted-foreground">Daily Rate</label>
          <Input
            type="number"
            className="h-7 text-xs text-center font-medium bg-background border-border focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={rateInputValues.daily}
            placeholder=""
            onChange={(e) => onRateInputChange(role.id, 'daily', e.target.value)}
            onKeyDown={(e) => onRateKeyDown(e, role.id, 'daily_rate')}
            onFocus={onRateFocus}
            onBlur={() => onRateBlur(role.id, 'daily_rate')}
            disabled={isUpdating}
            title="Click to select all, type new rate, press Enter to save"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-medium text-muted-foreground">Hourly Rate</label>
          <Input
            type="number"
            className="h-7 text-xs text-center font-medium bg-background border-border focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={rateInputValues.hourly}
            placeholder=""
            onChange={(e) => onRateInputChange(role.id, 'hourly', e.target.value)}
            onKeyDown={(e) => onRateKeyDown(e, role.id, 'hourly_rate')}
            onFocus={onRateFocus}
            onBlur={() => onRateBlur(role.id, 'hourly_rate')}
            disabled={isUpdating}
            title="Click to select all, type new rate, press Enter to save"
          />
        </div>
      </div>

      {/* Preferred Crew Row */}
      <div className="space-y-0.5">
        <label className="text-xs font-medium text-muted-foreground">Preferred Crew</label>
        <Select
          defaultValue={role.preferred_member?.id}
          onValueChange={(value) => onPreferredChange(role.id, value)}
        >
          <SelectTrigger className="h-7 text-xs bg-background border-border focus:border-primary">
            <SelectValue placeholder="Select crew member..." />
          </SelectTrigger>
          <CrewMemberSelectContent crew={crew || []} />
        </Select>
      </div>
    </div>
  );
});

MemoizedRoleItem.displayName = 'MemoizedRoleItem';

export function CompactCrewRolesList({ projectId, variantName }: CompactCrewRolesListProps) {
  const { crewRoles: roles, isLoading, invalidateCrewCache, updateCrewRole, removeCrewRole } = useVariantCrew(projectId, variantName);
  const { crew } = useCrew();
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set()); // Track which specific roles are updating
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [rateInputValues, setRateInputValues] = useState<Record<string, { daily: string; hourly: string }>>({});

  // Initialize input values when roles change - memoized to prevent unnecessary recalculations
  const initializeRateInputs = useCallback(() => {
    setRateInputValues(prev => {
      const newValues = { ...prev };
      roles.forEach(role => {
        if (!newValues[role.id]) { // Only initialize if not already present
          newValues[role.id] = {
            daily: role.daily_rate?.toString() || '',
            hourly: role.hourly_rate?.toString() || ''
          };
        }
      });
      return newValues;
    });
  }, [roles]);

  // Initialize when roles load or change
  React.useEffect(() => {
    if (roles.length > 0) {
      initializeRateInputs();
    }
  }, [roles, initializeRateInputs]);

  // Optimized callback functions with useCallback to prevent unnecessary re-renders
  const applyRateChange = useCallback(async (roleId: string, field: 'daily_rate' | 'hourly_rate') => {
    const inputKey = field === 'daily_rate' ? 'daily' : 'hourly';
    const inputValue = rateInputValues[roleId]?.[inputKey] || '';
    
    let newValue = null;
    if (inputValue !== '') {
      const parsedValue = parseFloat(inputValue);
      if (isNaN(parsedValue) || parsedValue < 0) {
        toast.error('Please enter a valid positive number');
        return;
      }
      newValue = parsedValue;
    }
    
    const currentRole = roles.find(r => r.id === roleId);
    const currentValue = field === 'daily_rate' ? currentRole?.daily_rate : currentRole?.hourly_rate;

    // Don't update if value hasn't changed
    if (newValue === currentValue) return;

    // Only mark this specific role as updating
    setUpdatingRoles(prev => new Set(prev.add(roleId)));
    try {
      await updateCrewRole(roleId, { [field]: newValue });
      
      // Update local state to reflect the new saved value
      setRateInputValues(prev => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [inputKey]: newValue?.toString() || ''
        }
      }));
    } catch (error) {
      console.error('Error updating rate:', error);
      // Reset to original value on error
      setRateInputValues(prev => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [inputKey]: currentValue?.toString() || ''
        }
      }));
    } finally {
      // Remove this specific role from updating state
      setUpdatingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(roleId);
        return newSet;
      });
    }
  }, [rateInputValues, roles, updateCrewRole]);

  const handleRateInputChange = useCallback((roleId: string, field: 'daily' | 'hourly', value: string) => {
    setRateInputValues(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [field]: value
      }
    }));
  }, []);

  const handleRateKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, roleId: string, field: 'daily_rate' | 'hourly_rate') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
      applyRateChange(roleId, field);
    } else if (e.key === 'Escape') {
      const currentRole = roles.find(r => r.id === roleId);
      const originalValue = field === 'daily_rate' ? currentRole?.daily_rate : currentRole?.hourly_rate;
      const inputKey = field === 'daily_rate' ? 'daily' : 'hourly';
      
      setRateInputValues(prev => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [inputKey]: originalValue?.toString() || ''
        }
      }));
      e.currentTarget.blur();
    }
  }, [roles, applyRateChange]);

  const handleRateFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  const handleRateBlur = useCallback((roleId: string, field: 'daily_rate' | 'hourly_rate') => {
    // Don't reset automatically on blur - let the user's changes persist
    // Only reset on Escape key or error
  }, []);

  const handlePreferredChange = useCallback(async (roleId: string, preferredId: string) => {
    setUpdatingRoles(prev => new Set(prev.add(roleId)));
    try {
      await updateCrewRole(roleId, { preferred_id: preferredId });
    } catch (error) {
      console.error('Error updating preferred crew:', error);
    } finally {
      setUpdatingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(roleId);
        return newSet;
      });
    }
  }, [updateCrewRole]);

  const handleDeleteRole = useCallback(async () => {
    if (!roleToDelete) return;
    
    setUpdatingRoles(prev => new Set(prev.add(roleToDelete)));
    try {
      await removeCrewRole(roleToDelete);
    } catch (error) {
      console.error('Error deleting role:', error);
    } finally {
      setUpdatingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(roleToDelete);
        return newSet;
      });
      setRoleToDelete(null);
    }
  }, [roleToDelete, removeCrewRole]);

  const handleDeleteRoleClick = useCallback((roleId: string) => {
    setRoleToDelete(roleId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-muted-foreground">
        No roles added yet
      </div>
    );
  }

  // Memoized sorting to prevent unnecessary recalculations
  const sortedRoles = useMemo(() => {
    const roleOrder = ['FOH', 'MON', 'PLB', 'BCK', 'PM', 'TM'];
    return [...roles].sort((a, b) => {
      const aIndex = roleOrder.indexOf(a.role?.name || '');
      const bIndex = roleOrder.indexOf(b.role?.name || '');
      return aIndex - bIndex;
    });
  }, [roles]);

  return (
    <>
      <div className="space-y-2">
        {sortedRoles.map((role) => (
          <MemoizedRoleItem
            key={role.id}
            role={role}
            crew={crew || []}
            rateInputValues={rateInputValues[role.id] || { daily: '', hourly: '' }}
            updatingRoles={updatingRoles}
            onRateInputChange={handleRateInputChange}
            onRateKeyDown={handleRateKeyDown}
            onRateFocus={handleRateFocus}
            onRateBlur={handleRateBlur}
            onPreferredChange={handlePreferredChange}
            onDeleteRole={handleDeleteRoleClick}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}