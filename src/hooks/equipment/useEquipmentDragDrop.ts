import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useEquipmentDragDrop(projectId: string) {
  const queryClient = useQueryClient();
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  const validateDrop = async (item: any, groupId: string): Promise<boolean> => {
    // Validate that the target group belongs to the current project
    const { data: group, error: groupError } = await supabase
      .from('project_equipment_groups')
      .select('project_id')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      toast.error('Invalid target group');
      return false;
    }

    // Validate that the group belongs to the current project
    if (group.project_id !== projectId) {
      toast.error('Cannot move equipment to a different project');
      return false;
    }

    // If moving existing project equipment
    if (item.type === 'project-equipment') {
      const { data: sourceEquipment, error: sourceError } = await supabase
        .from('project_equipment')
        .select('project_id')
        .eq('id', item.id)
        .single();

      if (sourceError || !sourceEquipment) {
        toast.error('Invalid equipment');
        return false;
      }

      // Validate that the equipment belongs to the current project
      if (sourceEquipment.project_id !== projectId) {
        toast.error('Cannot move equipment from a different project');
        return false;
      }
    }

    return true;
  };

  const handleDrop = async (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    if (target?.classList) {
      target.classList.remove('bg-primary/5', 'border-primary/20');
    }

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const item = JSON.parse(data);
      
      // Validate the drop operation
      const isValid = await validateDrop(item, groupId);
      if (!isValid) return;

      let newItemId: string | null = null;
      let eventId: string | null = null;

      if (item.type === 'project-equipment') {
        const { data: existingEquipment } = await supabase
          .from('project_equipment')
          .select('*')
          .eq('project_id', projectId)
          .eq('equipment_id', item.equipment_id)
          .eq('group_id', groupId)
          .maybeSingle();

        if (existingEquipment) {
          const { data } = await supabase
            .from('project_equipment')
            .update({ 
              quantity: (existingEquipment.quantity || 0) + (item.quantity || 1)
            })
            .eq('id', existingEquipment.id)
            .select()
            .single();
          
          if (data) {
            newItemId = data.id;
            eventId = item.event_id;
          }
        } else {
          const { data } = await supabase
            .from('project_equipment')
            .update({ group_id: groupId })
            .eq('id', item.id)
            .select()
            .single();
          
          if (data) {
            newItemId = data.id;
            eventId = item.event_id;
          }
        }
      } else {
        const { data: existingEquipment } = await supabase
          .from('project_equipment')
          .select('*')
          .eq('project_id', projectId)
          .eq('equipment_id', item.id)
          .eq('group_id', groupId)
          .maybeSingle();

        if (existingEquipment) {
          const { data } = await supabase
            .from('project_equipment')
            .update({ 
              quantity: (existingEquipment.quantity || 0) + 1 
            })
            .eq('id', existingEquipment.id)
            .select()
            .single();
          
          if (data) newItemId = data.id;
        } else {
          const { data } = await supabase
            .from('project_equipment')
            .insert({
              project_id: projectId,
              equipment_id: item.id,
              quantity: 1,
              group_id: groupId
            })
            .select()
            .single();
          
          if (data) newItemId = data.id;
        }
      }

      // Trigger sync operations for all events in the project
      const { data: events } = await supabase
        .from('project_events')
        .select('id')
        .eq('project_id', projectId)
        .neq('status', 'cancelled')
        .neq('status', 'invoice ready');

      if (events) {
        await Promise.all(events.map(async (event) => {
          await supabase
            .from('sync_operations')
            .insert({
              project_id: projectId,
              event_id: event.id,
              status: 'pending'
            });
        }));
      }

      // Invalidate all relevant queries to update UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project-equipment', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['project-events', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['sync-status'] }),
        ...(eventId ? [
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment', eventId] })
        ] : []),
        ...(events?.map(event => 
          queryClient.invalidateQueries({ queryKey: ['project-event-equipment', event.id] })
        ) || [])
      ]);

      if (newItemId) setLastAddedItemId(newItemId);
      toast.success('Equipment moved successfully');
    } catch (error) {
      console.error('Error moving equipment:', error);
      toast.error('Failed to move equipment');
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    if (target?.classList) {
      target.classList.add('bg-primary/5', 'border-primary/20');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    if (target?.classList) {
      target.classList.remove('bg-primary/5', 'border-primary/20');
    }
  }, []);

  return {
    lastAddedItemId,
    setLastAddedItemId,
    handleDrop,
    handleDragOver,
    handleDragLeave
  };
}