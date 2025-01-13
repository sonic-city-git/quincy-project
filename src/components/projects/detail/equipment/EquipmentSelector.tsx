import { ScrollArea } from "@/components/ui/scroll-area";
import { Equipment } from "@/types/equipment";
import { useEquipment } from "@/hooks/useEquipment";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { FOLDER_ORDER, SUBFOLDER_ORDER } from "@/utils/folderSort";
import { formatPrice } from "@/utils/priceFormatters";

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment) => void;
  projectId: string;
  selectedGroupId: string | null;
  className?: string;
}

export function EquipmentSelector({ onSelect, className }: EquipmentSelectorProps) {
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();
  const [searchQuery, setSearchQuery] = useState('');

  const handleDragStart = (e: React.DragEvent, item: Equipment) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Filter equipment based on search query
  const filteredEquipment = equipment.filter(item => 
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort folders according to the predefined order
  const sortedMainFolders = useMemo(() => {
    return folders
      .filter(folder => !folder.parent_id)
      .sort((a, b) => {
        const indexA = FOLDER_ORDER.indexOf(a.name);
        const indexB = FOLDER_ORDER.indexOf(b.name);
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
  }, [folders]);

  const getSubfolders = (parentId: string) => {
    const parentFolder = folders.find(f => f.id === parentId);
    if (!parentFolder) return [];

    const subfolders = folders.filter(folder => folder.parent_id === parentId);
    const orderArray = SUBFOLDER_ORDER[parentFolder.name] || [];

    return subfolders.sort((a, b) => {
      const indexA = orderArray.indexOf(a.name);
      const indexB = orderArray.indexOf(b.name);
      if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  // Group equipment by parent folder
  const groupedByParent = useMemo(() => {
    return filteredEquipment.reduce((acc, item) => {
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
  }, [filteredEquipment, folders]);

  // Determine which folders should be expanded based on search results
  const expandedFolders = useMemo(() => {
    if (!searchQuery) return [];
    
    return Object.entries(groupedByParent).reduce((acc: string[], [folderId, folder]) => {
      const hasMatchingItems = folder.items.length > 0;
      const hasMatchingSubfolders = Object.values(folder.subfolders).some(
        subfolder => subfolder.items.length > 0
      );
      
      if (hasMatchingItems || hasMatchingSubfolders) {
        acc.push(folderId);
      }
      return acc;
    }, []);
  }, [groupedByParent, searchQuery]);

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
        {item.rental_price && (
          <span className="text-sm text-muted-foreground">
            {formatPrice(item.rental_price)}
          </span>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading equipment...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Input
          placeholder="Search equipment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50"
        />
      </div>
      <ScrollArea className={cn("flex-1", className)}>
        <div className="px-4 pb-4">
          <Accordion 
            type="multiple" 
            className="space-y-2"
            defaultValue={expandedFolders}
            value={searchQuery ? expandedFolders : undefined}
          >
            {sortedMainFolders.map(mainFolder => {
              const folderContent = groupedByParent[mainFolder.id];
              if (!folderContent) return null;

              return (
                <AccordionItem key={mainFolder.id} value={mainFolder.id} className="border-none">
                  <AccordionTrigger className="py-2 px-3 hover:no-underline rounded-md hover:bg-accent/5 data-[state=open]:bg-accent/5">
                    <span className="text-sm font-medium text-muted-foreground">
                      {mainFolder.name}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-1">
                    <div className="space-y-2">
                      {/* Main folder items */}
                      {folderContent.items.length > 0 && (
                        <div className="space-y-1 px-1">
                          {folderContent.items.map(renderEquipmentCard)}
                        </div>
                      )}
                      
                      {/* Subfolders */}
                      {getSubfolders(mainFolder.id).map(subfolder => {
                        const subfolderContent = folderContent.subfolders[subfolder.id];
                        if (!subfolderContent?.items.length) return null;

                        return (
                          <Collapsible key={subfolder.id} defaultOpen={searchQuery.length > 0}>
                            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-full hover:bg-accent/5 px-3 py-1 rounded-md transition-colors">
                              <ChevronDown className="h-4 w-4" />
                              {subfolder.name}
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="space-y-1 pl-7 pr-1 pt-1">
                                {subfolderContent.items.map(renderEquipmentCard)}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
}