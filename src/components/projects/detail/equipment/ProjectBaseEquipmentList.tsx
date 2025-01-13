import { ScrollArea } from "@/components/ui/scroll-area";
import { ProjectEquipmentItem } from "./ProjectEquipmentItem";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/priceFormatters";

interface ProjectBaseEquipmentListProps {
  projectId: string;
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string | null) => void;
  onDrop: (e: React.DragEvent, groupId: string | null) => void;
}

export function ProjectBaseEquipmentList({ 
  projectId, 
  selectedGroupId,
  onGroupSelect,
  onDrop
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

  const calculateGroupTotal = (groupEquipment: any[]) => {
    return groupEquipment.reduce((total, item) => {
      return total + (item.rental_price || 0) * item.quantity;
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.classList.add('bg-accent/20', 'border-accent');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    const currentTarget = e.currentTarget as HTMLElement;
    
    if (!currentTarget.contains(relatedTarget)) {
      currentTarget.classList.remove('bg-accent/20', 'border-accent');
    }
  };

  const handleDrop = (e: React.DragEvent, groupId: string | null) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('bg-accent/20', 'border-accent');
    onDrop(e, groupId);
  };

  const sortEquipment = (items: any[]) => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  };

  const ungroupedEquipment = sortEquipment(equipment?.filter(item => !item.group_id) || []);
  const ungroupedTotal = calculateGroupTotal(ungroupedEquipment);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading equipment...</div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pr-4">
        {groups.map(group => {
          const groupEquipment = sortEquipment(equipment?.filter(item => item.group_id === group.id) || []);
          const isSelected = selectedGroupId === group.id;
          const groupTotal = calculateGroupTotal(groupEquipment);
          
          return (
            <div 
              key={group.id} 
              className={cn(
                "rounded-lg border-2 transition-all duration-200 relative overflow-hidden",
                isSelected 
                  ? "border-primary/20" 
                  : "border-zinc-800/50"
              )}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.id)}
            >
              <div className={cn(
                "absolute inset-0 transition-all duration-200",
                isSelected 
                  ? "bg-primary/5" 
                  : "bg-zinc-900/50"
              )} />
              <div className="relative z-20">
                <div className="bg-zinc-900/90">
                  <div 
                    className={cn(
                      "flex items-center justify-between px-4 py-2 cursor-pointer transition-colors text-white",
                      isSelected 
                        ? "bg-primary/20 hover:bg-primary/30" 
                        : "bg-zinc-800/50 hover:bg-zinc-800/70"
                    )}
                    onClick={() => onGroupSelect(group.id === selectedGroupId ? null : group.id)}
                  >
                    <h3 className="text-sm font-medium">{group.name}</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatPrice(groupTotal)}
                    </span>
                  </div>
                </div>
                <div className="p-3 space-y-2 relative z-30 bg-background/95">
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
            </div>
          );
        })}
        
        <div 
          className={cn(
            "rounded-lg border-2 transition-all duration-200 relative overflow-hidden",
            selectedGroupId === null 
              ? "border-primary/20" 
              : "border-zinc-800/50"
          )}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <div className={cn(
            "absolute inset-0 transition-all duration-200",
            selectedGroupId === null 
              ? "bg-primary/5" 
              : "bg-zinc-900/50"
          )} />
          <div className="relative z-20">
            <div className="bg-zinc-900/90">
              <div 
                className={cn(
                  "flex items-center justify-between px-4 py-2 cursor-pointer transition-colors text-white",
                  selectedGroupId === null 
                    ? "bg-primary/20 hover:bg-primary/30" 
                    : "bg-zinc-800/50 hover:bg-zinc-800/70"
                )}
                onClick={() => onGroupSelect(null)}
              >
                <h3 className="text-sm font-medium">Ungrouped Equipment</h3>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(ungroupedTotal)}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2 relative z-30 bg-background/95">
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
      </div>
    </ScrollArea>
  );
}