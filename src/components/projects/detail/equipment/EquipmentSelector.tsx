import { ScrollArea } from "@/components/ui/scroll-area";
import { Equipment } from "@/types/equipment";
import { useEquipment } from "@/hooks/useEquipment";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment) => void;
  projectId: string;
  selectedGroupId: string | null;
  className?: string;
}

export function EquipmentSelector({ onSelect, className }: EquipmentSelectorProps) {
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();

  const handleDragStart = (e: React.DragEvent, item: Equipment) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Group equipment by folder
  const groupedEquipment = equipment.reduce((acc, item) => {
    const folder = folders.find(f => f.id === item.folder_id);
    if (!folder) {
      if (!acc['Uncategorized']) acc['Uncategorized'] = [];
      acc['Uncategorized'].push(item);
      return acc;
    }

    // Find parent folder if this is a subfolder
    const parentFolder = folder.parent_id 
      ? folders.find(f => f.id === folder.parent_id)
      : null;

    const folderName = parentFolder 
      ? `${parentFolder.name}/${folder.name}`
      : folder.name;

    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(item);
    return acc;
  }, {} as Record<string, Equipment[]>);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading equipment...</div>;
  }

  return (
    <ScrollArea className={cn("h-full pr-4", className)}>
      <div className="space-y-4">
        {Object.entries(groupedEquipment).map(([folderName, items]) => (
          <div key={folderName} className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {folderName}
            </div>
            <div className="space-y-2">
              {items.map((item) => (
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
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}