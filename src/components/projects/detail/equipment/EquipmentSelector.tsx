import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEquipment } from "@/hooks/useEquipment";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment) => void;
  className?: string;
  projectId: string;
  selectedGroupId: string | null;
}

interface FolderStructure {
  [key: string]: {
    name: string;
    equipment: Equipment[];
    subfolders: {
      [key: string]: {
        name: string;
        equipment: Equipment[];
      }
    }
  }
}

export function EquipmentSelector({ onSelect, className, projectId, selectedGroupId }: EquipmentSelectorProps) {
  const [search, setSearch] = useState("");
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [openSubfolders, setOpenSubfolders] = useState<string[]>([]);
  const { addEquipment } = useProjectEquipment(projectId);

  useEffect(() => {
    if (search) {
      const relevantFolders = new Set<string>();
      equipment.forEach(item => {
        const searchLower = search.toLowerCase();
        const matches = item.name?.toLowerCase().includes(searchLower) ||
                       (item.code && item.code.toLowerCase().includes(searchLower));
        
        if (matches && item.folder_id) {
          relevantFolders.add(item.folder_id);
          const parentFolder = folders.find(f => {
            const subfolder = folders.find(sf => sf.id === item.folder_id);
            return subfolder?.parent_id === f.id;
          });
          if (parentFolder) {
            relevantFolders.add(parentFolder.id);
          }
        }
      });

      setOpenFolders(Array.from(relevantFolders));
      setOpenSubfolders(Array.from(relevantFolders));
    } else {
      setOpenFolders([]);
      setOpenSubfolders([]);
    }
  }, [search, equipment, folders]);

  const filteredEquipment = equipment.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      (item.code && item.code.toLowerCase().includes(searchLower))
    );
  });

  const organizeEquipment = () => {
    const structure: FolderStructure = {};
    const mainFolders = folders.filter(f => !f.parent_id);
    mainFolders.forEach(folder => {
      structure[folder.id] = {
        name: folder.name,
        equipment: [],
        subfolders: {}
      };
    });

    folders.filter(f => f.parent_id).forEach(subfolder => {
      if (subfolder.parent_id && structure[subfolder.parent_id]) {
        structure[subfolder.parent_id].subfolders[subfolder.id] = {
          name: subfolder.name,
          equipment: []
        };
      }
    });

    filteredEquipment.forEach(item => {
      if (item.folder_id) {
        const parentFolder = folders.find(f => {
          const subfolder = folders.find(sf => sf.id === item.folder_id);
          return subfolder?.parent_id === f.id;
        });

        if (parentFolder && structure[parentFolder.id]?.subfolders[item.folder_id]) {
          structure[parentFolder.id].subfolders[item.folder_id].equipment.push(item);
        } else if (structure[item.folder_id]) {
          structure[item.folder_id].equipment.push(item);
        }
      }
    });

    return structure;
  };

  const folderStructure = organizeEquipment();

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  const toggleSubfolder = (subfolderId: string) => {
    setOpenSubfolders(prev => 
      prev.includes(subfolderId)
        ? prev.filter(id => id !== subfolderId)
        : [...prev, subfolderId]
    );
  };

  const handleDoubleClick = async (item: Equipment) => {
    await addEquipment(item, selectedGroupId);
  };

  const renderEquipmentItem = (item: Equipment) => (
    <Button
      key={item.id}
      variant="ghost"
      className="w-full justify-start h-[26px] py-0"
      onClick={() => onSelect(item)}
      onDoubleClick={() => handleDoubleClick(item)}
    >
      <div className="text-left">
        <div className="text-sm font-medium leading-none">{item.name}</div>
      </div>
    </Button>
  );

  const hasContent = (folderId: string) => {
    const folder = folderStructure[folderId];
    if (!folder) return false;

    const hasMatchingEquipment = folder.equipment.length > 0;
    const hasMatchingSubfolders = Object.values(folder.subfolders).some(
      subfolder => subfolder.equipment.length > 0
    );

    return hasMatchingEquipment || hasMatchingSubfolders;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading equipment...</div>
          ) : Object.keys(folderStructure).length === 0 ? (
            <div className="text-sm text-muted-foreground">No equipment found</div>
          ) : (
            Object.entries(folderStructure)
              .filter(([folderId]) => hasContent(folderId))
              .map(([folderId, folder]) => (
                <Collapsible
                  key={folderId}
                  open={openFolders.includes(folderId)}
                  onOpenChange={() => toggleFolder(folderId)}
                >
                  <CollapsibleTrigger className="flex items-center w-full text-left py-1">
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      openFolders.includes(folderId) && "rotate-90"
                    )} />
                    <span className="font-semibold text-sm ml-1">{folder.name}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-3 space-y-0.5">
                    {folder.equipment.map(renderEquipmentItem)}

                    {Object.entries(folder.subfolders)
                      .filter(([, subfolder]) => subfolder.equipment.length > 0)
                      .map(([subId, sub]) => (
                        <Collapsible
                          key={subId}
                          open={openSubfolders.includes(subId)}
                          onOpenChange={() => toggleSubfolder(subId)}
                        >
                          <CollapsibleTrigger className="flex items-center w-full text-left py-1">
                            <ChevronRight className={cn(
                              "h-4 w-4 shrink-0 transition-transform duration-200",
                              openSubfolders.includes(subId) && "rotate-90"
                            )} />
                            <span className="font-medium text-sm ml-1 text-muted-foreground">
                              {sub.name}
                            </span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-4 space-y-0.5">
                            {sub.equipment.map(renderEquipmentItem)}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                  </CollapsibleContent>
                </Collapsible>
              ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
