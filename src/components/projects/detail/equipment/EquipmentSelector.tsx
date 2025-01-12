import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEquipment } from "@/hooks/useEquipment";
import { Equipment } from "@/integrations/supabase/types/equipment";
import { Search, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useProjectEquipment } from "@/hooks/useProjectEquipment";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

interface EquipmentGroup {
  id: string;
  name: string;
  sort_order: number | null;
}

export function EquipmentSelector({ onSelect, className, projectId }: EquipmentSelectorProps) {
  const [search, setSearch] = useState("");
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [openSubfolders, setOpenSubfolders] = useState<string[]>([]);
  const { addEquipment } = useProjectEquipment(projectId);
  const [groupSearch, setGroupSearch] = useState("");
  const [isGroupPopoverOpen, setIsGroupPopoverOpen] = useState(false);
  const { toast } = useToast();

  // Fetch equipment groups with proper error handling
  const { data: equipmentGroups = [] } = useQuery({
    queryKey: ['equipment-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_groups')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data || []; // Ensure we always return an array
    }
  });

  // Create new group
  const createGroup = async (name: string) => {
    if (!name.trim()) return; // Don't create empty groups
    
    try {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          name,
          project_id: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group created successfully",
      });

      setGroupSearch("");
      setIsGroupPopoverOpen(false);
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  // Create group from template
  const createGroupFromTemplate = async (template: EquipmentGroup) => {
    try {
      const { data, error } = await supabase
        .from('project_equipment_groups')
        .insert({
          name: template.name,
          project_id: projectId,
          sort_order: template.sort_order,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group created from template",
      });

      setGroupSearch("");
      setIsGroupPopoverOpen(false);
      return data;
    } catch (error) {
      console.error('Error creating group from template:', error);
      toast({
        title: "Error",
        description: "Failed to create group from template",
        variant: "destructive",
      });
    }
  };

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
      className="w-full justify-start h-[28px] py-0.5"
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
      <div className="space-y-4 mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Popover open={isGroupPopoverOpen} onOpenChange={setIsGroupPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isGroupPopoverOpen}
              className="w-full justify-between"
            >
              {groupSearch || "Select or create a group..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput
                placeholder="Search groups..."
                value={groupSearch}
                onValueChange={setGroupSearch}
              />
              <CommandEmpty>
                {groupSearch && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => createGroup(groupSearch)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create "{groupSearch}"
                  </Button>
                )}
              </CommandEmpty>
              <CommandGroup>
                {(equipmentGroups || [])
                  .filter(group => 
                    group.name.toLowerCase().includes(groupSearch.toLowerCase())
                  )
                  .map(group => (
                    <CommandItem
                      key={group.id}
                      onSelect={() => createGroupFromTemplate(group)}
                    >
                      {group.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
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