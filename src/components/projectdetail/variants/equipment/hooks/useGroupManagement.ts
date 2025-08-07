import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Types for better type safety
interface GroupManagementState {
  groupToDelete: string | null;
  targetGroupId: string;
  showNewGroupDialog: boolean;
  newGroupName: string;
  isLoading: boolean;
}

interface CreateGroupResult {
  id: string;
  project_id: string;
  name: string;
}

export function useGroupManagement(projectId: string, variantName: string) {
  const [state, setState] = useState<GroupManagementState>({
    groupToDelete: null,
    targetGroupId: "",
    showNewGroupDialog: false,
    newGroupName: "",
    isLoading: false
  });
  
  const queryClient = useQueryClient();

  // Helper function to invalidate all related queries
  const invalidateGroupQueries = useCallback(async () => {
    await Promise.all([
      // Invalidate the variant-specific resources cache
      queryClient.invalidateQueries({ 
        queryKey: ['variant-resources', projectId, variantName] 
      }),
      // Also invalidate any project-wide caches
      queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      }),
      queryClient.invalidateQueries({ 
        queryKey: ['project-equipment', projectId] 
      }),
      queryClient.invalidateQueries({
        queryKey: ['project-event-equipment', projectId]
      })
    ]);
  }, [queryClient, projectId, variantName]);

  const handleCreateGroup = useCallback(async (): Promise<CreateGroupResult | null> => {
    if (!state.newGroupName.trim()) {
      toast.error("Please enter a group name");
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // First get the variant_id from variantName
      const { data: variant, error: variantError } = await supabase
        .from('project_variants')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', variantName)
        .maybeSingle();

      if (variantError) {
        throw new Error(`Failed to find variant: ${variantError.message}`);
      }

      if (!variant) {
        throw new Error(`Variant "${variantName}" not found for project ${projectId}`);
      }

      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          variant_id: variant.id,
          name: state.newGroupName.trim(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create group: ${error.message}`);
      }

      await invalidateGroupQueries();
      toast.success('Group created successfully');
      
      setState(prev => ({ 
        ...prev, 
        showNewGroupDialog: false, 
        newGroupName: "",
        isLoading: false 
      }));
      
      return data as CreateGroupResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create group';
      toast.error(errorMessage);
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, [state.newGroupName, projectId, variantName, invalidateGroupQueries]);

  const handleDeleteGroup = async (groupId: string) => {
    try {
      // Get the current target group ID from state
      const currentTargetGroupId = state.targetGroupId;
      
      // First, handle the project_event_equipment references
      if (currentTargetGroupId) {
        // Move event equipment to target group
        const { error: eventUpdateError } = await supabase
          .from('project_event_equipment')
          .update({ group_id: currentTargetGroupId })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (eventUpdateError) {
          console.error('Error updating event equipment:', eventUpdateError);
          throw eventUpdateError;
        }

        // Move project equipment to target group
        const { error: updateError } = await supabase
          .from('project_equipment')
          .update({ group_id: currentTargetGroupId })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (updateError) {
          console.error('Error updating project equipment:', updateError);
          throw updateError;
        }
      } else {
        // Delete event equipment when no target group is selected
        const { error: eventDeleteError } = await supabase
          .from('project_event_equipment')
          .delete()
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (eventDeleteError) {
          console.error('Error deleting event equipment:', eventDeleteError);
          throw eventDeleteError;
        }

        // Delete project equipment when no target group is selected
        const { error: equipmentDeleteError } = await supabase
          .from('project_equipment')
          .delete()
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (equipmentDeleteError) {
          console.error('Error deleting project equipment:', equipmentDeleteError);
          throw equipmentDeleteError;
        }
      }

      // Finally delete the group itself
      const { error: deleteError } = await supabase
        .from('project_equipment_groups')
        .delete()
        .eq('id', groupId)
        .eq('project_id', projectId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      // Invalidate all relevant queries to refresh the UI
      console.log('🔄 Invalidating caches for variant:', variantName, 'project:', projectId);
      await Promise.all([
        // Invalidate the variant-specific resources cache
        queryClient.invalidateQueries({ 
          queryKey: ['variant-resources', projectId, variantName] 
        }),
        // Also invalidate any project-wide caches
        queryClient.invalidateQueries({ 
          queryKey: ['project-equipment-groups', projectId] 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['project-equipment', projectId] 
        }),
        queryClient.invalidateQueries({
          queryKey: ['project-event-equipment', projectId]
        })
      ]);
      console.log('✅ Cache invalidation complete');
      
      toast.success(currentTargetGroupId ? 'Equipment moved and group deleted' : 'Equipment and group deleted');
      setState(prev => ({ 
        ...prev, 
        groupToDelete: null, 
        targetGroupId: "" 
      }));
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error.message || 'Failed to delete group');
    }
  };

  // State setters with proper typing
  const setGroupToDelete = useCallback((groupId: string | null) => {
    setState(prev => ({ ...prev, groupToDelete: groupId }));
  }, []);

  const setTargetGroupId = useCallback((groupId: string) => {
    setState(prev => ({ ...prev, targetGroupId: groupId }));
  }, []);

  const setShowNewGroupDialog = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showNewGroupDialog: show }));
  }, []);

  const setNewGroupName = useCallback((name: string) => {
    setState(prev => ({ ...prev, newGroupName: name }));
  }, []);

  return {
    // State values
    groupToDelete: state.groupToDelete,
    targetGroupId: state.targetGroupId,
    showNewGroupDialog: state.showNewGroupDialog,
    newGroupName: state.newGroupName,
    isLoading: state.isLoading,
    
    // State setters
    setGroupToDelete,
    setTargetGroupId,
    setShowNewGroupDialog,
    setNewGroupName,
    
    // Actions
    handleCreateGroup,
    handleDeleteGroup,
  };
}