import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
}

export function ProjectBaseEquipmentList({ projectId, selectedGroupId }: ProjectBaseEquipmentListProps) {
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

  if (selectedGroupId) {
    const groupEquipment = equipment?.filter(item => item.group_id === selectedGroupId) || [];
    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    
    return (
      <ScrollArea className="h-[700px]">
        <div className="space-y-6 pr-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{selectedGroup?.name}</h3>
            <div className="space-y-2">
              {groupEquipment.length === 0 ? (
                <div className="text-sm text-muted-foreground">No equipment in this group</div>
              ) : (
                groupEquipment.map((item) => (
                  <ProjectEquipmentItem
                    key={item.id}
                    item={item}
                    onRemove={() => removeEquipment(item.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-6 pr-4">
        {groups.map(group => (
          <div key={group.id}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{group.name}</h3>
            <div className="space-y-2">
              {equipment?.filter(item => item.group_id === group.id).map((item) => (
                <ProjectEquipmentItem
                  key={item.id}
                  item={item}
                  onRemove={() => removeEquipment(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
        
        {ungroupedEquipment.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Ungrouped Equipment</h3>
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
        )}
      </div>
    </ScrollArea>
  );
}