import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GroupSelectorProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function GroupSelector({ projectId, onGroupSelect }: GroupSelectorProps) {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customGroupName, setCustomGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: equipmentGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['equipment-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_groups')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  const { data: projectGroups = [], isLoading: isLoadingProjectGroups } = useQuery({
    queryKey: ['project-equipment-groups', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  });

  const handleAddGroup = async (name: string) => {
    setIsSubmitting(true);
    try {
      // First check if the group already exists
      const { data: existingGroup } = await supabase
        .from('project_equipment_groups')
        .select('id')
        .eq('project_id', projectId)
        .eq('name', name)
        .maybeSingle();

      if (existingGroup) {
        // If the group exists, select it and notify the user
        onGroupSelect(existingGroup.id);
        setCustomGroupName("");
        setIsCustomDialogOpen(false);
        toast.info("Group already exists, selecting it");
        return;
      }

      // Calculate the next sort order
      const maxSortOrder = projectGroups.reduce((max, group) => 
        Math.max(max, group.sort_order || 0), -1);
      const nextSortOrder = maxSortOrder + 1;

      // If the group doesn't exist, create it
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name,
          sort_order: nextSortOrder
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment-groups', projectId] 
      });

      // Select the newly created group
      if (data) {
        onGroupSelect(data.id);
      }
      
      setCustomGroupName("");
      setIsCustomDialogOpen(false);
      toast.success("Group added successfully");
    } catch (error: any) {
      console.error('Error adding group:', error);
      toast.error(error.message || "Failed to add group");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingGroups || isLoadingProjectGroups) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading groups...</span>
      </div>
    );
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Group
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {equipmentGroups.map(group => (
            <DropdownMenuItem
              key={group.id}
              onClick={() => handleAddGroup(group.name)}
            >
              {group.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            className="font-medium"
            onClick={() => setIsCustomDialogOpen(true)}
          >
            + Custom
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter group name"
              value={customGroupName}
              onChange={(e) => setCustomGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customGroupName.trim()) {
                  handleAddGroup(customGroupName);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomDialogOpen(false);
                setCustomGroupName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAddGroup(customGroupName)}
              disabled={!customGroupName.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}