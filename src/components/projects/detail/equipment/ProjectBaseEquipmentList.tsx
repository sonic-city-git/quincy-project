import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
}

export function ProjectBaseEquipmentList({ 
  projectId, 
  selectedGroupId,
  onGroupSelect 
}: ProjectBaseEquipmentListProps) {
  const { equipment, loading, removeEquipment } = useProjectEquipment(projectId);
  const queryClient = useQueryClient();

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
    },
    enabled: !!projectId
  });

  const handleDrop = async (e: React.DragEvent, newGroupId: string | null) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-accent', 'border-accent');
    
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const { id, currentGroupId } = JSON.parse(data) as { id: string; currentGroupId: string | null };
    if (currentGroupId === newGroupId) return;

    try {
      const { error } = await supabase
        .from('project_equipment')
        .update({ group_id: newGroupId })
        .eq('id', id);

      if (error) throw error;
      
      await queryClient.invalidateQueries({ 
        queryKey: ['project-equipment', projectId]
      });
      
      toast.success('Equipment moved successfully');
    } catch (error) {
      console.error('Error moving equipment:', error);
      toast.error('Failed to move equipment');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.add('bg-accent', 'border-accent');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-accent', 'border-accent');
  };

  const ungroupedEquipment = equipment?.filter(item => !item.group_id) || [];
  
  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading equipment...</div>
    );
  }

  return (
    <ScrollArea className="h-[700px] pr-4">
      <div className="space-y-6">
        {groups.map(group => {
          const groupEquipment = equipment?.filter(item => item.group_id === group.id) || [];
          const isSelected = selectedGroupId === group.id;
          
          return (
            <div 
              key={group.id} 
              className={cn(
                "rounded-lg border border-border bg-background/50 transition-all duration-200",
                isSelected && "ring-2 ring-primary/20"
              )}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.id)}
            >
              <h3 
                className={cn(
                  "text-sm font-medium px-4 py-2 cursor-pointer transition-colors sticky top-0 z-10",
                  isSelected 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-secondary/10 text-secondary-foreground hover:bg-secondary/20"
                )}
                onClick={() => onGroupSelect(group.id === selectedGroupId ? null : group.id)}
              >
                {group.name}
              </h3>
              <div className="p-3 space-y-2">
                {groupEquipment.map((item) => (
                  <ProjectEquipmentItem
                    key={item.id}
                    item={item}
                    onRemove={() => removeEquipment(item.id)}
                  />
                ))}
                {groupEquipment.length === 0 && (
                  <div className="text-sm text-muted-foreground px-1">
                    No equipment in this group
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div 
          className={cn(
            "rounded-lg border border-border bg-background/50 transition-all duration-200",
            selectedGroupId === null && "ring-2 ring-primary/20"
          )}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <h3 
            className={cn(
              "text-sm font-medium px-4 py-2 cursor-pointer transition-colors sticky top-0 z-10",
              selectedGroupId === null 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-secondary/10 text-secondary-foreground hover:bg-secondary/20"
            )}
            onClick={() => onGroupSelect(null)}
          >
            Ungrouped Equipment
          </h3>
          <div className="p-3 space-y-2">
            {ungroupedEquipment.map((item) => (
              <ProjectEquipmentItem
                key={item.id}
                item={item}
                onRemove={() => removeEquipment(item.id)}
              />
            ))}
            {ungroupedEquipment.length === 0 && (
              <div className="text-sm text-muted-foreground px-1">
                No ungrouped equipment
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}