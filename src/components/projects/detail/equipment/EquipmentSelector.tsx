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

export function EquipmentSelector({ onSelect, className, projectId }: EquipmentSelectorProps) {
  const [search, setSearch] = useState("");
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [openSubfolders, setOpenSubfolders] = useState<string[]>([]);
  const { addEquipment } = useProjectEquipment(projectId);

  // Update open folders when searching
  useEffect(() => {
    if (search) {
      // Get all folder IDs that contain matching equipment
      const relevantFolders = new Set<string>();
      equipment.forEach(item => {
        const searchLower = search.toLowerCase();
        const matches = item.name?.toLowerCase().includes(searchLower) ||
                       (item.code && item.code.toLowerCase().includes(searchLower));
        
        if (matches && item.folder_id) {
          // Add the direct folder
          relevantFolders.add(item.folder_id);
          
          // Find and add parent folder if it exists
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
      // Clear open folders when search is empty
      setOpenFolders([]);
      setOpenSubfolders([]);
    }
  }, [search, equipment, folders]);

  // Filter equipment based on search
  const filteredEquipment = equipment.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      (item.code && item.code.toLowerCase().includes(searchLower))
    );
  });

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

    // Organize filtered equipment into folders
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

  // Calculate folder structure
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
    await addEquipment(item);
  };

  const renderEquipmentItem = (item: Equipment) => (
    <Button
      key={item.id}
      variant="ghost"
      className="w-full justify-start h-[64px] py-1"
      onClick={() => onSelect(item)}
      onDoubleClick={() => handleDoubleClick(item)}
    >
      <div className="text-left">
        <div className="font-medium leading-tight">{item.name}</div>
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
        <div className="space-y-2 pr-4">
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
