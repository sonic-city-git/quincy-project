import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
}

export function ProjectBaseEquipmentList({ projectId }: ProjectBaseEquipmentListProps) {
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

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading equipment...</div>;
  }

  // Group equipment by group_id
  const groupedEquipment = equipment?.reduce((acc, item) => {
    const groupId = item.group_id || 'ungrouped';
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(item);
    return acc;
  }, {} as Record<string, typeof equipment>);

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-6 pr-4">
        {/* Always render all groups, even if empty */}
        {groups.map((group) => (
          <div key={group.id} className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {group.name}
            </h3>
            <div className="space-y-2">
              {(groupedEquipment[group.id] || []).map((item) => (
                <ProjectEquipmentItem
                  key={item.id}
                  item={item}
                  onRemove={() => removeEquipment(item.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Render ungrouped equipment last */}
        {groupedEquipment['ungrouped'] && groupedEquipment['ungrouped'].length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Ungrouped
            </h3>
            <div className="space-y-2">
              {groupedEquipment['ungrouped'].map((item) => (
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