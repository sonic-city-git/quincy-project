import { ScrollArea } from "@/components/ui/scroll-area";
import { Equipment } from "@/types/equipment";
import { useEquipment } from "@/hooks/useEquipment";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment) => void;
  projectId: string;
  selectedGroupId: string | null;
  className?: string;
}

export function EquipmentSelector({ onSelect, className }: EquipmentSelectorProps) {
  const { equipment = [], loading } = useEquipment();

  const handleDragStart = (e: React.DragEvent, item: Equipment) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading equipment...</div>;
  }

  return (
    <ScrollArea className={cn("h-full pr-4", className)}>
      <div className="space-y-2">
        {equipment.map((item) => (
          <Card
            key={item.id}
            className="p-3 cursor-move hover:bg-accent/5 transition-colors border-zinc-800/50"
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onClick={() => onSelect(item)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium leading-none">
                  {item.name}
                </h3>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}