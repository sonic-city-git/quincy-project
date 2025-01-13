import { Card } from "@/components/ui/card";
import { Box, ListCheck } from "lucide-react";
import { GroupSelector } from "./GroupSelector";
import { useState } from "react";
import { EquipmentSelector } from "./EquipmentSelector";
import { ProjectBaseEquipmentList } from "./ProjectBaseEquipmentList";
import { Equipment } from "@/types/equipment";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/utils/priceFormatters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectEquipmentTabProps {
  projectId: string;
}

export function ProjectEquipmentTab({ projectId }: ProjectEquipmentTabProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showGroupSelectDialog, setShowGroupSelectDialog] = useState(false);
  const [pendingEquipment, setPendingEquipment] = useState<Equipment | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const { equipment, addEquipment } = useProjectEquipment(projectId);

  const { data: groups = [] } = useQuery({
    queryKey: ['project-equipment-groups', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate total price across all equipment
  const totalPrice = equipment?.reduce((total, item) => {
    return total + (item.rental_price || 0) * item.quantity;
  }, 0) || 0;

  const handleEquipmentSelect = async (equipment: Equipment) => {
    if (groups.length === 0) {
      setPendingEquipment(equipment);
      setShowGroupDialog(true);
      return;
    }

    if (!selectedGroupId) {
      setPendingEquipment(equipment);
      setShowGroupSelectDialog(true);
      return;
    }

    try {
      await addEquipment(equipment, selectedGroupId);
      toast.success('Equipment added to project');
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast.error('Failed to add equipment');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          project_id: projectId,
          name: newGroupName,
          sort_order: groups.length
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedGroupId(data.id);
      setShowGroupDialog(false);
      setNewGroupName("");

      // If there was pending equipment, add it to the new group
      if (pendingEquipment && data.id) {
        await addEquipment(pendingEquipment, data.id);
        setPendingEquipment(null);
        toast.success('Equipment added to new group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleSelectGroup = async (groupId: string) => {
    setSelectedGroupId(groupId);
    setShowGroupSelectDialog(false);

    if (pendingEquipment) {
      try {
        await addEquipment(pendingEquipment, groupId);
        setPendingEquipment(null);
        toast.success('Equipment added to group');
      } catch (error) {
        console.error('Error adding equipment:', error);
        toast.error('Failed to add equipment');
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-14 gap-6 h-[calc(100vh-12rem)]">
          {/* Available Equipment Column */}
          <Card className="md:col-span-6 bg-zinc-800/45 rounded-lg border border-zinc-700/50 transition-colors flex flex-col h-full overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-700/50">
              <div className="flex items-center justify-between h-9">
                <div className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Available Equipment</h2>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <EquipmentSelector 
                onSelect={handleEquipmentSelect} 
                projectId={projectId}
                selectedGroupId={selectedGroupId}
                className="h-full"
              />
            </div>
          </Card>
          
          {/* Project Equipment Column */}
          <Card className="md:col-span-8 bg-zinc-800/45 rounded-lg border border-zinc-700/50 transition-colors flex flex-col h-full overflow-hidden">
            <div className="flex-shrink-0 px-4 py-3 border-b border-zinc-700/50">
              <div className="flex items-center justify-between h-9">
                <div className="flex items-center gap-2">
                  <ListCheck className="h-5 w-5 text-primary" />
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Project Equipment</h2>
                    <span className="text-sm text-muted-foreground">
                      Total: {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
                <GroupSelector 
                  projectId={projectId} 
                  selectedGroupId={selectedGroupId}
                  onGroupSelect={setSelectedGroupId}
                />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProjectBaseEquipmentList 
                projectId={projectId} 
                selectedGroupId={selectedGroupId}
                onGroupSelect={setSelectedGroupId}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Equipment Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              You need to create a group before adding equipment to the project.
            </p>
            <Input
              placeholder="Enter group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newGroupName.trim()) {
                  handleCreateGroup();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGroupDialog(false);
                setNewGroupName("");
                setPendingEquipment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Select Group Dialog */}
      <Dialog open={showGroupSelectDialog} onOpenChange={setShowGroupSelectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Equipment Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select a group to add the equipment to:
            </p>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {groups.map((group) => (
                  <Button
                    key={group.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSelectGroup(group.id)}
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGroupSelectDialog(false);
                setPendingEquipment(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}