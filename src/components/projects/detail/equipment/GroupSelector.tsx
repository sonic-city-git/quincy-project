import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
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

interface GroupSelectorProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function GroupSelector({ projectId }: GroupSelectorProps) {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customGroupName, setCustomGroupName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddGroup = async (name: string, sortOrder: number = projectGroups.length) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name,
          sort_order: sortOrder
        });
      
      if (error) throw error;
      
      setCustomGroupName("");
      setIsCustomDialogOpen(false);
    } catch (error) {
      console.error('Error adding group:', error);
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
    <div className="flex justify-end mb-4">
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
              onClick={() => handleAddGroup(group.name, group.sort_order)}
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