import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEquipment } from "@/hooks/useEquipment";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment) => void;
  className?: string;
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

export function EquipmentSelector({ onSelect, className }: EquipmentSelectorProps) {
  const [search, setSearch] = useState("");
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [openSubfolders, setOpenSubfolders] = useState<string[]>([]);

  // Filter equipment based on search
  const filteredEquipment = equipment.filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.code?.toLowerCase().includes(search.toLowerCase())
  );

  // Organize equipment into folder structure
  const organizeEquipment = () => {
    const structure: FolderStructure = {};

    // Get main folders
    const mainFolders = folders.filter(f => !f.parent_id);
    mainFolders.forEach(folder => {
      structure[folder.id] = {
        name: folder.name,
        equipment: [],
        subfolders: {}
      };
    });

    // Get subfolders and initialize them
    folders.filter(f => f.parent_id).forEach(subfolder => {
      if (subfolder.parent_id && structure[subfolder.parent_id]) {
        structure[subfolder.parent_id].subfolders[subfolder.id] = {
          name: subfolder.name,
          equipment: []
        };
      }
    });

    // Organize equipment into folders
    filteredEquipment.forEach(item => {
      if (item.folder_id) {
        // Check if it belongs to a subfolder
        const parentFolder = folders.find(f => {
          const subfolder = folders.find(sf => sf.id === item.folder_id);
          return subfolder?.parent_id === f.id;
        });

        if (parentFolder && structure[parentFolder.id]?.subfolders[item.folder_id]) {
          // Add to subfolder
          structure[parentFolder.id].subfolders[item.folder_id].equipment.push(item);
        } else if (structure[item.folder_id]) {
          // Add to main folder
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

  const renderEquipmentItem = (item: Equipment) => (
    <Button
      key={item.id}
      variant="ghost"
      className="w-full justify-start h-auto py-2"
      onClick={() => onSelect(item)}
    >
      <div className="text-left">
        <div className="font-medium">{item.name}</div>
      </div>
    </Button>
  );

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
        <div className="space-y-2 pr-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading equipment...</div>
          ) : Object.keys(folderStructure).length === 0 ? (
            <div className="text-sm text-muted-foreground">No equipment found</div>
          ) : (
            Object.entries(folderStructure).map(([folderId, folder]) => (
              <Collapsible
                key={folderId}
                open={openFolders.includes(folderId)}
                onOpenChange={() => toggleFolder(folderId)}
              >
                <CollapsibleTrigger className="flex items-center w-full text-left py-2">
                  <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    openFolders.includes(folderId) && "rotate-90"
                  )} />
                  <span className="font-semibold text-sm ml-2">{folder.name}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-6 space-y-1">
                  {/* Main folder equipment */}
                  {folder.equipment.map(renderEquipmentItem)}

                  {/* Subfolders */}
                  {Object.entries(folder.subfolders).map(([subId, sub]) => (
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
                        <span className="font-medium text-sm ml-2 text-muted-foreground">
                          {sub.name}
                        </span>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-6 space-y-1">
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