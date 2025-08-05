/**
 * Compact Crew Roles List - More condensed view for variant layout
 */

import { useProjectRoles } from "@/hooks/useProjectRoles";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCrew } from "@/hooks/useCrew";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CrewMemberSelectContent } from "@/components/resources/crew/CrewMemberSelectContent";
import { SONIC_CITY_FOLDER_ID } from "@/constants/organizations";
import { getRoleBadgeStyle } from "@/design-system";

interface CompactCrewRolesListProps {
  projectId: string;
  variantName: string;
}

export function CompactCrewRolesList({ projectId, variantName }: CompactCrewRolesListProps) {
  const { roles, isLoading, refetch } = useProjectRoles(projectId);
  const { crew } = useCrew(SONIC_CITY_FOLDER_ID);
  const [isUpdating, setIsUpdating] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

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
      toast.success('Preferred crew updated successfully');
    } catch (error) {
      console.error('Error updating preferred crew:', error);
      toast.error('Failed to update preferred crew');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    
    setIsUpdating(true);
    try {
      // Delete event role assignments first
      await supabase
        .from('project_event_roles')
        .delete()
        .eq('project_id', projectId)
        .eq('role_id', roleToDelete);

      // Delete the project role
      await supabase
        .from('project_roles')
        .delete()
        .eq('id', roleToDelete);

      await refetch();
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    } finally {
      setIsUpdating(false);
      setRoleToDelete(null);
    }
  };

  if (isLoading || isUpdating) {
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

  // Sort roles based on predefined order
  const roleOrder = ['FOH', 'MON', 'PLB', 'BCK', 'PM', 'TM'];
  const sortedRoles = [...roles].sort((a, b) => {
    const aIndex = roleOrder.indexOf(a.role?.name || '');
    const bIndex = roleOrder.indexOf(b.role?.name || '');
    return aIndex - bIndex;
  });

  return (
    <>
      <div className="space-y-2">
        {/* Compact header */}
        <div className="grid grid-cols-[80px_60px_60px_1fr_24px] gap-2 px-2 text-xs font-medium text-muted-foreground">
          <div>Role</div>
          <div>Daily</div>
          <div>Hourly</div>
          <div>Preferred</div>
          <div></div>
        </div>

        {/* Compact role rows */}
        {sortedRoles.map((role) => (
          <div 
            key={role.id} 
            className="grid grid-cols-[80px_60px_60px_1fr_24px] gap-2 px-2 py-1.5 bg-muted/30 rounded text-xs items-center"
          >
            {/* Role Badge */}
            <span 
              className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium truncate"
              style={role.role?.name ? getRoleBadgeStyle(role.role.name) : {}}
            >
              {role.role?.name}
            </span>
            
            {/* Daily Rate */}
            <Input
              type="number"
              className="h-7 text-xs text-center border-0 bg-transparent focus:bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              defaultValue={role.daily_rate?.toString()}
              placeholder="0"
              onBlur={(e) => handleRateChange(role.id, 'daily_rate', e.target.value)}
            />
            
            {/* Hourly Rate */}
            <Input
              type="number"
              className="h-7 text-xs text-center border-0 bg-transparent focus:bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              defaultValue={role.hourly_rate?.toString()}
              placeholder="0"
              onBlur={(e) => handleRateChange(role.id, 'hourly_rate', e.target.value)}
            />
            
            {/* Preferred Crew */}
            <Select
              defaultValue={role.preferred?.id}
              onValueChange={(value) => handlePreferredChange(role.id, value)}
            >
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:bg-background">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <CrewMemberSelectContent crew={crew || []} />
            </Select>
            
            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRoleToDelete(role.id)}
              className="h-6 w-6 p-0 hover:bg-destructive/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
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