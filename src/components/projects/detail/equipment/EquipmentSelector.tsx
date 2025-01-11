import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEquipment } from "@/hooks/useEquipment";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";

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

  const renderEquipmentItem = (item: Equipment) => (
    <Button
      key={item.id}
      variant="outline"
      className="w-full justify-start"
      onClick={() => onSelect(item)}
    >
      <div className="text-left">
        <div className="font-medium">{item.name}</div>
        <div className="text-sm text-muted-foreground">{item.code || '-'}</div>
      </div>
    </Button>
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading equipment...</div>
          ) : Object.keys(folderStructure).length === 0 ? (
            <div className="text-sm text-muted-foreground">No equipment found</div>
          ) : (
            Object.entries(folderStructure).map(([folderId, folder]) => (
              <div key={folderId} className="space-y-2">
                {/* Main folder name */}
                <h3 className="font-semibold text-sm text-muted-foreground">
                  {folder.name}
                </h3>
                
                {/* Main folder equipment */}
                <div className="space-y-2 pl-4">
                  {folder.equipment.map(renderEquipmentItem)}
                </div>

                {/* Subfolders */}
                {Object.entries(folder.subfolders).map(([subId, sub]) => (
                  <div key={subId} className="space-y-2 mt-2">
                    <h4 className="font-medium text-sm text-muted-foreground pl-4">
                      {sub.name}
                    </h4>
                    <div className="space-y-2 pl-8">
                      {sub.equipment.map(renderEquipmentItem)}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}