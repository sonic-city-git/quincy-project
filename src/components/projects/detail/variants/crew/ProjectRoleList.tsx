import { useProjectRoles } from "@/hooks/useProjectRoles";
import { Card } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCrew } from "@/hooks/useCrew";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CrewMemberSelectContent } from "@/components/resources/crew/CrewMemberSelectContent";
import { SONIC_CITY_FOLDER_ID } from "@/constants/organizations";
import { 
  getRoleBadgeStyle, 
  FORM_PATTERNS, 
  COMPONENT_CLASSES,
  createCurrencyInput,
  cn 
} from "@/design-system";

interface ProjectRoleListProps {
  projectId: string;
}

export function ProjectRoleList({ projectId }: ProjectRoleListProps) {
  const { roles, isLoading, refetch } = useProjectRoles(projectId);
  const { crew } = useCrew(SONIC_CITY_FOLDER_ID);
  const [isUpdating, setIsUpdating] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

  // Memoize currency input styles for performance
  const currencyInputStyles = useMemo(() => createCurrencyInput(), []);

  // Memoize sorted roles for performance
  const sortedRoles = useMemo(() => {
    const roleOrder = ['FOH', 'MON', 'PLB', 'BCK', 'PM', 'TM'];
    return [...roles].sort((a, b) => {
      const aIndex = roleOrder.indexOf(a.role?.name || '');
      const bIndex = roleOrder.indexOf(b.role?.name || '');
      return aIndex - bIndex;
    });
  }, [roles]);

  const handleRateChange = async (roleId: string, field: 'daily_rate' | 'hourly_rate', value: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({ [field]: parseFloat(value) || 0 })
        .eq('id', roleId);

      if (error) throw error;
      await refetch();
      toast.success('Rate updated successfully');
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error('Failed to update rate');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferredChange = async (roleId: string, preferredId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('project_roles')
        .update({ preferred_id: preferredId })
        .eq('id', roleId);

      if (error) throw error;

      await refetch();
      toast.success('Preferred member updated');
    } catch (error) {
      console.error('Error updating preferred member:', error);
      toast.error('Failed to update preferred member');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    
    setIsUpdating(true);
    try {
      const roleToRemove = roles.find(r => r.id === roleToDelete);
      if (!roleToRemove?.role?.id) {
        throw new Error('Role not found');
      }

      // Delete event role assignments first, then project role
      const { error: eventRolesError } = await supabase
        .from('project_event_roles')
        .delete()
        .eq('project_id', projectId)
        .eq('role_id', roleToRemove.role.id);

      if (eventRolesError) {
        throw new Error(`Failed to delete event role assignments: ${eventRolesError.message}`);
      }

      const { error: projectRoleError } = await supabase
        .from('project_roles')
        .delete()
        .eq('id', roleToDelete);

      if (projectRoleError) {
        throw new Error(`Failed to delete project role: ${projectRoleError.message}`);
      }

      await refetch();
      toast.success('Role deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
      setRoleToDelete(null);
    }
  };

  if (isLoading || isUpdating) {
    return (
      <div className="flex justify-center py-8" role="status" aria-label="Loading roles">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No roles added yet</p>
        <p className="text-xs mt-2">Use the "Add Role" button above to get started</p>
      </div>
    );
  }

  return (
    <div className={FORM_PATTERNS.layout.singleColumn}>
      {/* Table Header */}
      <div className="grid grid-cols-[200px_1fr_48px] gap-4 px-4 mb-2" role="row">
        <div className={cn(FORM_PATTERNS.label.default, "text-sm font-medium")} role="columnheader">
          Role
        </div>
        <div className="grid grid-cols-[1fr_1fr_2fr] gap-4" role="rowgroup">
          <div className={cn(FORM_PATTERNS.label.default, "text-sm font-medium")} role="columnheader">
            Daily rate
          </div>
          <div className={cn(FORM_PATTERNS.label.default, "text-sm font-medium")} role="columnheader">
            Hourly rate
          </div>
          <div className={cn(FORM_PATTERNS.label.default, "text-sm font-medium")} role="columnheader">
            Preferred crew
          </div>
        </div>
        <div role="columnheader" aria-label="Actions" /> {/* Spacer for delete button column */}
      </div>

      {/* Role Cards */}
      {sortedRoles.map((role) => (
        <Card key={role.id} className={cn(COMPONENT_CLASSES.card.default, "p-4")}>
          <div className="grid grid-cols-[200px_1fr_48px] gap-4 items-center" role="row">
            {/* Role Badge */}
            <span 
              className="inline-flex items-center justify-center w-32 px-3 py-1.5 rounded-md text-sm font-medium"
              style={role.role?.name ? getRoleBadgeStyle(role.role.name) : {}}
              role="cell"
            >
              {role.role?.name}
            </span>
            
            {/* Rate Inputs and Preferred Crew */}
            <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 items-center" role="rowgroup">
              {/* Daily Rate with Norwegian Currency */}
              <div className={currencyInputStyles.container}>
                <span className={currencyInputStyles.symbol}>kr</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  max={99999}
                  className={cn(
                    currencyInputStyles.input,
                    FORM_PATTERNS.input.default,
                    "text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  )}
                  defaultValue={role.daily_rate?.toString()}
                  placeholder="7500"
                  onBlur={(e) => handleRateChange(role.id, 'daily_rate', e.target.value)}
                  aria-label={`Daily rate for ${role.role?.name}`}
                />
              </div>
              
              {/* Hourly Rate with Norwegian Currency */}
              <div className={currencyInputStyles.container}>
                <span className={currencyInputStyles.symbol}>kr</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  max={99999}
                  className={cn(
                    currencyInputStyles.input,
                    FORM_PATTERNS.input.default,
                    "text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  )}
                  defaultValue={role.hourly_rate?.toString()}
                  placeholder="850"
                  onBlur={(e) => handleRateChange(role.id, 'hourly_rate', e.target.value)}
                  aria-label={`Hourly rate for ${role.role?.name}`}
                />
              </div>
              
              {/* Preferred Crew Selection */}
              <Select
                defaultValue={role.preferred?.id}
                onValueChange={(value) => handlePreferredChange(role.id, value)}
              >
                <SelectTrigger className={cn(FORM_PATTERNS.dropdown.trigger, "max-w-[300px]")}>
                  <SelectValue placeholder="Select preferred" />
                </SelectTrigger>
                <CrewMemberSelectContent crew={crew || []} />
              </Select>
            </div>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={() => setRoleToDelete(role.id)}
              aria-label={`Delete ${role.role?.name} role`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent className={FORM_PATTERNS.dialog.container}>
          <AlertDialogHeader className={FORM_PATTERNS.dialog.header}>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the role from the project and delete any crew assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={FORM_PATTERNS.dialog.footer}>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
