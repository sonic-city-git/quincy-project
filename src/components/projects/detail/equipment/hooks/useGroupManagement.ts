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

export function useGroupManagement(projectId: string) {
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
  }, [queryClient, projectId]);

  const handleCreateGroup = useCallback(async (): Promise<CreateGroupResult | null> => {
    if (!state.newGroupName.trim()) {
      toast.error("Please enter a group name");
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
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
  }, [state.newGroupName, projectId, invalidateGroupQueries]);

  const handleDeleteGroup = async (groupId: string) => {
    try {
      // First, handle the project_event_equipment references
      if (targetGroupId) {
        // Move event equipment to target group
        const { error: eventUpdateError } = await supabase
          .from('project_event_equipment')
          .update({ group_id: targetGroupId })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (eventUpdateError) {
          console.error('Error updating event equipment:', eventUpdateError);
          throw eventUpdateError;
        }

        // Move project equipment to target group
        const { error: updateError } = await supabase
          .from('project_equipment')
          .update({ group_id: targetGroupId })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (updateError) {
          console.error('Error updating project equipment:', updateError);
          throw updateError;
        }
      } else {
        // Remove group_id from event equipment
        const { error: eventNullError } = await supabase
          .from('project_event_equipment')
          .update({ group_id: null })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (eventNullError) {
          console.error('Error nullifying event equipment:', eventNullError);
          throw eventNullError;
        }

        // Remove group_id from project equipment
        const { error: nullError } = await supabase
          .from('project_equipment')
          .update({ group_id: null })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (nullError) {
          console.error('Error nullifying project equipment:', nullError);
          throw nullError;
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
      await Promise.all([
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
      
      toast.success('Group deleted successfully');
      setGroupToDelete(null);
      setTargetGroupId("");
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