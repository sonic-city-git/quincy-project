import { EquipmentListHeader } from "@/components/equipment/EquipmentListHeader";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEquipmentFilters } from "@/components/equipment/filters/useEquipmentFilters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

interface EquipmentSelectorProps {
  onSelect: (equipmentId: string) => void;
  projectId: string;
  selectedGroupId: string | null;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
}

const FOLDER_ORDER = [
  "Mixers",
  "Microphones",
  "DI-boxes",
  "Cables/Split",
  "WL",
  "Outboard",
  "Stands/Clamps",
  "Misc",
  "Flightcases",
  "Consumables",
  "Kits",
  "Mindnes"
];

const SUBFOLDER_ORDER: Record<string, string[]> = {
  "Mixers": ["Mixrack", "Surface", "Expansion", "Small format"],
  "Microphones": ["Dynamic", "Condenser", "Ribbon", "Shotgun", "WL capsule", "Special/Misc"],
  "DI-boxes": ["Active", "Passive", "Special"],
  "Cables/Split": ["CAT", "XLR", "LK37/SB", "Jack", "Coax", "Fibre", "Schuko"],
  "WL": ["MIC", "IEM", "Antenna"]
};

export function EquipmentSelector({ onSelect, projectId, selectedGroupId }: EquipmentSelectorProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const {
    searchQuery,
    setSearchQuery,
    selectedFolders,
    handleFolderToggle,
    clearFilters,
    filterEquipment
  } = useEquipmentFilters();

  const { data: equipment = [] } = useQuery({
    queryKey: ['available-equipment', searchQuery, selectedFolders],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          equipment_folders (
            id,
            name,
            parent_id
          )
        `)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['equipment-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_folders')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const mainFolders = useMemo(() => 
    folders
      .filter(folder => !folder.parent_id)
      .sort((a, b) => {
        const indexA = FOLDER_ORDER.indexOf(a.name);
        const indexB = FOLDER_ORDER.indexOf(b.name);
        return indexA - indexB;
      }), [folders]);

  const getSubfolders = (parentId: string) => {
    const parentFolder = folders.find(f => f.id === parentId);
    if (!parentFolder) return [];

    const subfolders = folders.filter(folder => folder.parent_id === parentId);
    const orderArray = SUBFOLDER_ORDER[parentFolder.name] || [];

    return subfolders.sort((a, b) => {
      const indexA = orderArray.indexOf(a.name);
      const indexB = orderArray.indexOf(b.name);
      return indexA - indexB;
    });
  };

  const filteredEquipment = useMemo(() => filterEquipment(equipment), [equipment, searchQuery, selectedFolders]);

  const getFolderEquipment = (folderId: string) => {
    return filteredEquipment.filter(item => item.folder_id === folderId);
  };

  const renderFolderContent = (folder: Folder) => {
    const subfolders = getSubfolders(folder.id);
    const folderEquipment = getFolderEquipment(folder.id);
    const hasMatchingEquipment = folderEquipment.length > 0;
    const hasMatchingSubfolders = subfolders.some(subfolder => 
      getFolderEquipment(subfolder.id).length > 0
    );

    if (!searchQuery || hasMatchingEquipment || hasMatchingSubfolders) {
      return (
        <div key={folder.id} className="space-y-1">
          <Collapsible defaultOpen={!!searchQuery && (hasMatchingEquipment || hasMatchingSubfolders)}>
            <CollapsibleTrigger className="flex items-center w-full hover:bg-accent/50 px-2 h-[28px] text-sm font-medium rounded-md">
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 ui-open:rotate-90" />
              <span className="ml-1">{folder.name}</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1">
              {subfolders.map(subfolder => {
                const subfolderEquipment = getFolderEquipment(subfolder.id);
                if (searchQuery && subfolderEquipment.length === 0) return null;

                return (
                  <Collapsible key={subfolder.id} defaultOpen={!!searchQuery && subfolderEquipment.length > 0}>
                    <CollapsibleTrigger className="flex items-center w-full hover:bg-accent/50 px-2 h-[28px] text-sm font-medium rounded-md">
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 ui-open:rotate-90" />
                      <span className="ml-1">{subfolder.name}</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-1">
                      {subfolderEquipment.map(item => (
                        <button
                          key={item.id}
                          onClick={() => onSelect(item.id)}
                          className="w-full text-left px-4 h-[28px] text-sm font-medium hover:bg-accent rounded-md transition-colors"
                        >
                          {item.name}
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
              {folderEquipment.map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className="w-full text-left px-4 h-[28px] text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <EquipmentListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
        selectedItem={selectedItem}
        onEquipmentDeleted={() => setSelectedItem(null)}
        selectedFolders={selectedFolders}
        onFolderToggle={handleFolderToggle}
      />
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-1">
          {mainFolders.map(folder => renderFolderContent(folder))}
        </div>
      </ScrollArea>
    </div>
  );
}