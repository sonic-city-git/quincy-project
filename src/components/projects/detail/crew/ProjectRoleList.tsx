import { useProjectRoles } from "@/hooks/useProjectRoles";
import { Card } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCrew } from "@/hooks/useCrew";
import { useCrewSort } from "@/components/crew/useCrewSort";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProjectRoleListProps {
  projectId: string;
}

export function ProjectRoleList({ projectId }: ProjectRoleListProps) {
  const { roles, isLoading, refetch } = useProjectRoles(projectId);
  const { crew } = useCrew();
  const { sortCrew } = useCrewSort();
  const [isUpdating, setIsUpdating] = useState(false);
  const { project } = useProjectDetails(projectId);
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
      // First update the project role
      const { error } = await supabase
        .from('project_roles')
        .update({ preferred_id: preferredId })
        .eq('id', roleId);

      if (error) throw error;

      // Check if the preferred member is from Sonic City
      const preferredMember = crew?.find(member => member.id === preferredId);
      const SONIC_CITY_FOLDER_ID = "34f3469f-02bd-4ecf-82f9-11a4e88c2d77";
      
      if (preferredMember?.folder_id === SONIC_CITY_FOLDER_ID) {
        // Get all events for this project that need crew
        const { data: events, error: eventsError } = await supabase
          .from('project_events')
          .select('id, event_types!inner(needs_crew)')
          .eq('project_id', projectId)
          .eq('event_types.needs_crew', true);

        if (eventsError) throw eventsError;

        if (events?.length > 0) {
          // Create event role assignments for each event
          const eventRoles = events.map(event => ({
            project_id: projectId,
            event_id: event.id,
            role_id: roles.find(r => r.id === roleId)?.role?.id,
            crew_member_id: preferredId
          }));

          const { error: assignmentError } = await supabase
            .from('project_event_roles')
            .upsert(eventRoles);

          if (assignmentError) throw assignmentError;
        }
      } else {
        console.log('Preferred member is not from Sonic City, skipping auto-assignment');
      }

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

      console.log('Starting role deletion process:', {
        projectRoleId: roleToDelete,
        crewRoleId: roleToRemove.role.id
      });

      // Step 1: Delete event role assignments first
      console.log('Step 1: Deleting event role assignments');
      const { error: eventRolesError, data: deletedEventRoles } = await supabase
        .from('project_event_roles')
        .delete()
        .eq('project_id', projectId)
        .eq('role_id', roleToRemove.role.id)
        .select();

      if (eventRolesError) {
        console.error('Error deleting event roles:', eventRolesError);
        throw eventRolesError;
      }
      console.log('Deleted event roles:', deletedEventRoles);

      // Step 2: Delete the project role
      console.log('Step 2: Deleting project role');
      const { error: projectRoleError, data: deletedProjectRole } = await supabase
        .from('project_roles')
        .delete()
        .eq('id', roleToDelete)
        .select();

      if (projectRoleError) {
        console.error('Error deleting project role:', projectRoleError);
        throw projectRoleError;
      }
      console.log('Deleted project role:', deletedProjectRole);

      await refetch();
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Error in handleDeleteRole:', error);
      toast.error('Failed to delete role');
    } finally {
      setIsUpdating(false);
      setRoleToDelete(null);
    }
  };

  if (isLoading || isUpdating) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No roles added yet
      </div>
    );
  }

  const sortedCrew = sortCrew(crew || []);

  // Sort roles based on predefined order
  const roleOrder = ['FOH', 'MON', 'PLB', 'BCK', 'PM', 'TM'];
  const sortedRoles = [...roles].sort((a, b) => {
    const aIndex = roleOrder.indexOf(a.role?.name || '');
    const bIndex = roleOrder.indexOf(b.role?.name || '');
    return aIndex - bIndex;
  });

  // ... keep existing code (JSX rendering)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[200px_1fr_48px] gap-4 px-4 mb-2">
        <div className="text-sm font-medium">Role</div>
        <div className="grid grid-cols-[1fr_1fr_2fr] gap-4">
          <div className="text-sm font-medium">Daily rate</div>
          <div className="text-sm font-medium">Hourly rate</div>
          <div className="text-sm font-medium">Preferred crew</div>
        </div>
        <div /> {/* Spacer for delete button column */}
      </div>

      {sortedRoles.map((role) => (
        <Card key={role.id} className="p-4 bg-zinc-900/50">
          <div className="grid grid-cols-[200px_1fr_48px] gap-4 items-center">
            <span 
              className="inline-flex items-center justify-center w-32 px-3 py-1.5 rounded-md text-sm font-medium text-white"
              style={{ 
                backgroundColor: role.role?.color
              }}
            >
              {role.role?.name}
            </span>
            
            <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 items-center">
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                max={99999}
                className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                defaultValue={role.daily_rate?.toString()}
                placeholder="Daily rate"
                onBlur={(e) => handleRateChange(role.id, 'daily_rate', e.target.value)}
              />
              
              <Input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                max={99999}
                className="w-24 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                defaultValue={role.hourly_rate?.toString()}
                placeholder="Hourly rate"
                onBlur={(e) => handleRateChange(role.id, 'hourly_rate', e.target.value)}
              />
              
              <Select
                defaultValue={role.preferred?.id}
                onValueChange={(value) => handlePreferredChange(role.id, value)}
              >
                <SelectTrigger className="max-w-[300px]">
                  <SelectValue placeholder="Select preferred" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto bg-zinc-900 border border-zinc-800">
                  {sortedCrew.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => setRoleToDelete(role.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}

      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the role from the project and delete any crew assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
