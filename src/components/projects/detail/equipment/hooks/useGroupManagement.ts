import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useGroupManagement(projectId: string) {
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [targetGroupId, setTargetGroupId] = useState("");
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const queryClient = useQueryClient();

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name: newGroupName.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['project-equipment-groups'] });
      toast.success('Group created successfully');
      setShowNewGroupDialog(false);
      setNewGroupName("");
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
      return null;
    }
  };

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

        if (eventUpdateError) throw eventUpdateError;

        // Move project equipment to target group
        const { error: updateError } = await supabase
          .from('project_equipment')
          .update({ group_id: targetGroupId })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (updateError) throw updateError;
      } else {
        // Remove group_id from event equipment
        const { error: eventNullError } = await supabase
          .from('project_event_equipment')
          .update({ group_id: null })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (eventNullError) throw eventNullError;

        // Remove group_id from project equipment
        const { error: nullError } = await supabase
          .from('project_equipment')
          .update({ group_id: null })
          .eq('group_id', groupId)
          .eq('project_id', projectId);

        if (nullError) throw nullError;
      }

      // Finally delete the group itself
      const { error: deleteError } = await supabase
        .from('project_equipment_groups')
        .delete()
        .match({ 
          id: groupId,
          project_id: projectId 
        });

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

  return {
    groupToDelete,
    setGroupToDelete,
    targetGroupId,
    setTargetGroupId,
    showNewGroupDialog,
    setShowNewGroupDialog,
    newGroupName,
    setNewGroupName,
    handleCreateGroup,
    handleDeleteGroup,
  };
}