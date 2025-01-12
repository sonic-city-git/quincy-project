import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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

  const ungroupedEquipment = equipment?.filter(item => !item.group_id) || [];
  
  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading equipment...</div>
    );
  }

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-6 pr-4">
        {groups.map(group => {
          const groupEquipment = equipment?.filter(item => item.group_id === group.id) || [];
          const isSelected = selectedGroupId === group.id;
          
          return (
            <div key={group.id}>
              <h3 
                className={cn(
                  "text-sm font-medium mb-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                  isSelected && "bg-accent text-accent-foreground hover:bg-accent"
                )}
                onClick={() => onGroupSelect(group.id === selectedGroupId ? null : group.id)}
              >
                {group.name}
              </h3>
              <div className="space-y-2">
                {groupEquipment.map((item) => (
                  <ProjectEquipmentItem
                    key={item.id}
                    item={item}
                    onRemove={() => removeEquipment(item.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        
        <div>
          <h3 
            className={cn(
              "text-sm font-medium mb-2 px-3 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
              selectedGroupId === null && "bg-accent text-accent-foreground hover:bg-accent"
            )}
            onClick={() => onGroupSelect(null)}
          >
            Ungrouped Equipment
          </h3>
          <div className="space-y-2">
            {ungroupedEquipment.map((item) => (
              <ProjectEquipmentItem
                key={item.id}
                item={item}
                onRemove={() => removeEquipment(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}