import { ScrollArea } from "@/components/ui/scroll-area";
import { Equipment } from "@/types/equipment";
import { useEquipment } from "@/hooks/useEquipment";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

  // First, group equipment by parent folder
  const groupedByParent = equipment.reduce((acc, item) => {
    const folder = folders.find(f => f.id === item.folder_id);
    if (!folder) {
      if (!acc['uncategorized']) acc['uncategorized'] = { name: 'Uncategorized', items: [], subfolders: {} };
      acc['uncategorized'].items.push(item);
      return acc;
    }

    const parentFolder = folder.parent_id 
      ? folders.find(f => f.id === folder.parent_id)
      : folder;

    const parentId = parentFolder.id;
    
    if (!acc[parentId]) {
      acc[parentId] = {
        name: parentFolder.name,
        items: [],
        subfolders: {}
      };
    }

    if (folder.parent_id) {
      // This is a subfolder
      if (!acc[parentId].subfolders[folder.id]) {
        acc[parentId].subfolders[folder.id] = {
          name: folder.name,
          items: []
        };
      }
      acc[parentId].subfolders[folder.id].items.push(item);
    } else {
      // This is a main folder item
      acc[parentId].items.push(item);
    }

    return acc;
  }, {} as Record<string, { name: string; items: Equipment[]; subfolders: Record<string, { name: string; items: Equipment[] }> }>);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading equipment...</div>;
  }

  const renderEquipmentCard = (item: Equipment) => (
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
  );

  return (
    <ScrollArea className={cn("h-full pr-4", className)}>
      <Accordion type="multiple" className="space-y-4">
        {Object.entries(groupedByParent).map(([folderId, folder]) => (
          <AccordionItem key={folderId} value={folderId} className="border-none">
            <AccordionTrigger className="py-2 hover:no-underline">
              <span className="text-sm font-medium text-muted-foreground">
                {folder.name}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <div className="space-y-4">
                {/* Main folder items */}
                {folder.items.length > 0 && (
                  <div className="space-y-2">
                    {folder.items.map(renderEquipmentCard)}
                  </div>
                )}
                
                {/* Subfolders */}
                {Object.entries(folder.subfolders).map(([subfolderId, subfolder]) => (
                  <div key={subfolderId} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground pl-2 border-l-2 border-muted">
                      {subfolder.name}
                    </div>
                    <div className="space-y-2 pl-2">
                      {subfolder.items.map(renderEquipmentCard)}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </ScrollArea>
  );
}