import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string) => void;
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
            <button
              onClick={() => onGroupSelect(group.id)}
              className={cn(
                "w-full text-left font-medium text-sm uppercase tracking-wide px-2 py-1 rounded transition-colors",
                selectedGroupId === group.id 
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              {group.name}
            </button>
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