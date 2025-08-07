import { ScrollArea } from "@/components/ui/scroll-area";
import { Equipment } from "@/types/equipment";
import { useEquipment } from "@/hooks/useEquipment";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFolders } from "@/hooks/useFolders";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useCallback, useEffect } from "react";
import React from "react";
import { FOLDER_ORDER, SUBFOLDER_ORDER } from "@/utils/equipmentFolderSort";
import { FORM_PATTERNS, createFieldIconClasses, COMPONENT_CLASSES } from "@/design-system";
import { formatPrice } from "@/utils/priceFormatters";

interface EquipmentSelectorProps {
  onSelect: (equipment: Equipment) => void;
  projectId: string;
  selectedGroupId: string | null;
  className?: string;
  stickySearch?: boolean;
  searchQuery?: string;
}

// Types for optimized folder structure
interface SubfolderData {
  name: string;
  items: Equipment[];
}

interface FolderData {
  name: string;
  items: Equipment[];
  subfolders: Record<string, SubfolderData>;
}

// Memoized Equipment Card Component
const EquipmentCard = React.memo(({ item, onSelect, onDragStart }: {
  item: Equipment;
  onSelect: (equipment: Equipment) => void;
  onDragStart: (e: React.DragEvent, item: Equipment) => void;
}) => {
  const handleDoubleClick = useCallback(() => {
    onSelect(item);
  }, [item, onSelect]);

  const handleDragStartInternal = useCallback((e: React.DragEvent) => {
    onDragStart(e, item);
  }, [item, onDragStart]);

  return (
    <Card
      className={cn(
        COMPONENT_CLASSES.card.hover,
        "cursor-move group transition-all duration-200",
        "border-l-4 border-l-transparent hover:border-l-primary",
        "w-full min-h-[32px] max-w-full", // Fixed: consistent height, constrained width
        "py-1 px-2"
      )}
      draggable
      onDragStart={handleDragStartInternal}
      onDoubleClick={handleDoubleClick}
      role="button"
      tabIndex={0}
      aria-label={`Add ${item.name} to variant. Double-click or drag to add.`}
    >
      <div className="flex items-center justify-between gap-2 min-h-[24px] w-full overflow-hidden">
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          <div className="w-1 h-1 rounded-full bg-muted-foreground/50 group-hover:bg-primary/70 transition-colors flex-shrink-0" />
          <h3 className="text-xs font-medium leading-tight text-foreground group-hover:text-primary transition-colors truncate flex-1 min-w-0">
            {item.name}
          </h3>
          {item.code && (
            <span className="text-xs text-muted-foreground/70 font-mono bg-muted/40 px-1 py-0.5 rounded leading-none flex-shrink-0 max-w-[80px] truncate">
              {item.code}
            </span>
          )}
        </div>
        {item.rental_price && (
          <div className="text-xs text-muted-foreground/80 font-medium flex-shrink-0 max-w-[100px] truncate text-right">
            {formatPrice(item.rental_price)}
          </div>
        )}
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.code === nextProps.item.code &&
    prevProps.item.rental_price === nextProps.item.rental_price &&
    prevProps.onSelect === nextProps.onSelect &&
    prevProps.onDragStart === nextProps.onDragStart
  );
});

EquipmentCard.displayName = 'EquipmentCard';

// Simple Subfolder Component
const SubfolderSection = React.memo(({ 
  subfolder, 
  subfolderContent, 
  isOpen,
  onExpandedChange,
  onSelect,
  onDragStart
}: {
  subfolder: { id: string; name: string };
  subfolderContent: SubfolderData;
  isOpen: boolean;
  onExpandedChange: (folderId: string, open: boolean) => void;
  onSelect: (equipment: Equipment) => void;
  onDragStart: (e: React.DragEvent, item: Equipment) => void;
}) => {
  // Don't render if no items
  if (!subfolderContent?.items.length) return null;

  return (
    <Collapsible 
      open={isOpen}
      onOpenChange={(open) => onExpandedChange(subfolder.id, open)}
    >
      <CollapsibleTrigger 
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-full hover:bg-muted/50 py-1 rounded-md transition-colors mt-1"
        title={`Click to toggle ${subfolder.name} subfolder`}
      >
        <ChevronDown className="h-4 w-4" />
        {subfolder.name}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 pl-4 pt-1 w-full overflow-hidden">
          {subfolderContent.items.map(item => (
            <EquipmentCard
              key={item.id}
              item={item}
              onSelect={onSelect}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

SubfolderSection.displayName = 'SubfolderSection';

export function EquipmentSelector({ onSelect, className, stickySearch = false, searchQuery: externalSearchQuery }: EquipmentSelectorProps) {
  // Memoize onSelect to prevent EquipmentCard re-renders
  const memoizedOnSelect = useCallback((equipment: Equipment) => {
    onSelect(equipment);
  }, [onSelect]);
  const { equipment = [], loading } = useEquipment();
  const { folders = [] } = useFolders();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  
  // Use external search query if provided, otherwise use internal
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  // Clear manual expansions when search changes to avoid conflicts
  useEffect(() => {
    setExpandedFolders([]);
  }, [searchQuery]);

  // Memoized drag start handler
  const handleDragStart = useCallback((e: React.DragEvent, item: Equipment) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // Memoized filtered equipment with optimized search
  const filteredEquipment = useMemo(() => {
    if (!searchQuery.trim()) return equipment;
    
    const lowercaseQuery = searchQuery.toLowerCase();
    return equipment.filter(item => 
      item.name?.toLowerCase().includes(lowercaseQuery) ||
      item.code?.toLowerCase().includes(lowercaseQuery)
    );
  }, [equipment, searchQuery]);

  // Memoized folder structure for optimal lookups
  const folderMap = useMemo(() => {
    const map = new Map();
    folders.forEach(folder => {
      map.set(folder.id, folder);
    });
    return map;
  }, [folders]);

  // Memoized subfolder lookup
  const subfoldersByParent = useMemo(() => {
    const map = new Map<string, any[]>();
    
    folders.forEach(folder => {
      if (folder.parent_id) {
        if (!map.has(folder.parent_id)) {
          map.set(folder.parent_id, []);
        }
        map.get(folder.parent_id)!.push(folder);
      }
    });

    // Sort subfolders for each parent
    map.forEach((subfolders, parentId) => {
      const parentFolder = folderMap.get(parentId);
      if (!parentFolder) return;
      
      const orderArray = SUBFOLDER_ORDER[parentFolder.name] || [];
      subfolders.sort((a, b) => {
        const indexA = orderArray.indexOf(a.name);
        const indexB = orderArray.indexOf(b.name);
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    });

    return map;
  }, [folders, folderMap]);

  // Memoized sorted main folders
  const sortedMainFolders = useMemo(() => {
    return folders
      .filter(folder => !folder.parent_id)
      .sort((a, b) => {
        const indexA = FOLDER_ORDER.indexOf(a.name as any);
        const indexB = FOLDER_ORDER.indexOf(b.name as any);
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
  }, [folders]);

  // Highly optimized equipment grouping with stable references
  const groupedByParent = useMemo(() => {
    const result: Record<string, FolderData> = {};
    
    // Create stable arrays for items to prevent unnecessary re-renders
    const itemsByFolder = new Map<string, Equipment[]>();
    const itemsBySubfolder = new Map<string, Equipment[]>();
    
    // Group equipment items by folder/subfolder
    filteredEquipment.forEach(item => {
      const folder = folderMap.get(item.folder_id);
      
      if (!folder) {
        // Uncategorized items
        if (!itemsByFolder.has('uncategorized')) {
          itemsByFolder.set('uncategorized', []);
        }
        itemsByFolder.get('uncategorized')!.push(item);
        return;
      }

      // Determine parent folder
      const parentFolder = folder.parent_id ? folderMap.get(folder.parent_id) : folder;
      if (!parentFolder) return;

      if (folder.parent_id) {
        // This is a subfolder item
        const subfolderKey = `${parentFolder.id}:${folder.id}`;
        if (!itemsBySubfolder.has(subfolderKey)) {
          itemsBySubfolder.set(subfolderKey, []);
        }
        itemsBySubfolder.get(subfolderKey)!.push(item);
      } else {
        // This is a main folder item
        if (!itemsByFolder.has(parentFolder.id)) {
          itemsByFolder.set(parentFolder.id, []);
        }
        itemsByFolder.get(parentFolder.id)!.push(item);
      }
    });

    // Build final structure with stable references
    itemsByFolder.forEach((items, folderId) => {
      if (folderId === 'uncategorized') {
        result['uncategorized'] = { 
          name: 'Uncategorized', 
          items, 
          subfolders: {} 
        };
      } else {
        const folder = folderMap.get(folderId);
        if (folder) {
          result[folderId] = {
            name: folder.name,
            items,
            subfolders: {}
          };
        }
      }
    });

    // Add subfolders
    itemsBySubfolder.forEach((items, key) => {
      const [parentId, subfolderid] = key.split(':');
      const subfolder = folderMap.get(subfolderid);
      
      if (!result[parentId]) {
        const parentFolder = folderMap.get(parentId);
        if (parentFolder) {
          result[parentId] = {
            name: parentFolder.name,
            items: [],
            subfolders: {}
          };
        }
      }
      
      if (subfolder && result[parentId]) {
        result[parentId].subfolders[subfolderid] = {
          name: subfolder.name,
          items
        };
      }
    });

    return result;
  }, [filteredEquipment, folderMap]);

  // Memoized auto-expanded folders calculation
  const autoExpandedFolders = useMemo(() => {
    if (!searchQuery) return [];
    
    const expanded: string[] = [];
    
    Object.entries(groupedByParent).forEach(([folderId, folder]) => {
      const hasMatchingItems = folder.items.length > 0;
      const hasMatchingSubfolders = Object.values(folder.subfolders).some(
        subfolder => subfolder.items.length > 0
      );

      if (hasMatchingItems || hasMatchingSubfolders) {
        expanded.push(folderId);
      }
    });

    return expanded;
  }, [groupedByParent, searchQuery]);

  // Memoized combined expanded folders with stable reference
  const allExpandedFolders = useMemo(() => {
    const combined = [...new Set([...autoExpandedFolders, ...expandedFolders])];
    return combined;
  }, [autoExpandedFolders, expandedFolders]);

  // Simple Cmd+click: expand/collapse main folder + all subfolders
  const handleCmdClickExpansion = useCallback((folderId: string) => {
    const folderData = groupedByParent[folderId];
    if (!folderData) return;
    
    const subfolderIds = Object.keys(folderData.subfolders);
    const allFolderIds = [folderId, ...subfolderIds];
    
    setExpandedFolders(prev => {
      // If main folder is currently expanded, collapse everything
      const isMainFolderExpanded = prev.includes(folderId);
      
      if (isMainFolderExpanded) {
        // Collapse: remove main folder and all subfolders
        return prev.filter(id => !allFolderIds.includes(id));
      } else {
        // Expand: add main folder and all subfolders
        return [...prev, ...allFolderIds];
      }
    });
  }, [groupedByParent]);

  // Simple subfolder expansion handler 
  const handleSubfolderExpansion = useCallback((folderId: string, open: boolean) => {
    setExpandedFolders(prev => 
      open ? [...prev, folderId] : prev.filter(id => id !== folderId)
    );
  }, []);

  // Handle manual folder toggle (normal clicks)
  const handleFolderToggle = useCallback((folderId: string) => {
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  }, []);

  // Disable Accordion's automatic state management
  const handleAccordionValueChange = useCallback(() => {
    // Do nothing - we handle state manually
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading equipment...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conditional Search Field - only show if using internal search */}
      {externalSearchQuery === undefined && (
        <div className={cn(
          "px-4 py-3",
          stickySearch && "sticky top-0 z-5 bg-background/85 backdrop-blur-sm border-b border-border/20 shadow-sm"
        )}>
          <div className={FORM_PATTERNS.fieldContainer.withIcon}>
            <Search className={cn(createFieldIconClasses(), "text-muted-foreground/60")} />
            <Input
              placeholder="Search equipment..."
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              className={cn(
                FORM_PATTERNS.input.withIcon,
                "w-full bg-muted/30 border-border/40 focus:bg-background focus:border-primary/50 transition-colors h-9"
              )}
              aria-label="Search equipment by name or code"
            />
          </div>
        </div>
      )}
      <ScrollArea className={cn("flex-1", className)}>
        <div className="px-4 pt-2 pb-4 w-full overflow-hidden">
          <Accordion 
            type="multiple" 
            className="space-y-2 w-full"
            value={allExpandedFolders}
            onValueChange={handleAccordionValueChange}
          >
            {sortedMainFolders.map(mainFolder => {
              const folderContent = groupedByParent[mainFolder.id];
              if (!folderContent) return null;

              return (
                <AccordionItem key={mainFolder.id} value={mainFolder.id} className="border-none w-full">
                  <AccordionTrigger 
                    className="py-2 px-3 hover:no-underline rounded-md hover:bg-muted/50 data-[state=open]:bg-muted/50 w-full"
                    title={`Click to toggle ${mainFolder.name}. Cmd+click to expand/collapse all subfolders.`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const isCtrlClick = e.metaKey || e.ctrlKey;
                      if (isCtrlClick) {
                        handleCmdClickExpansion(mainFolder.id);
                      } else {
                        handleFolderToggle(mainFolder.id);
                      }
                    }}
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {mainFolder.name}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-1 px-2 w-full">
                    <div className="space-y-1 w-full overflow-hidden">
                      {/* Main folder items */}
                      {folderContent.items.length > 0 && (
                        <div className="space-y-0.5 w-full overflow-hidden">
                          {folderContent.items.map(item => (
                            <EquipmentCard
                              key={item.id}
                              item={item}
                              onSelect={memoizedOnSelect}
                              onDragStart={handleDragStart}
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Subfolders */}
                      {subfoldersByParent.get(mainFolder.id)?.map(subfolder => (
                        <SubfolderSection
                          key={subfolder.id}
                          subfolder={subfolder}
                          subfolderContent={folderContent.subfolders[subfolder.id]}
                          isOpen={allExpandedFolders.includes(subfolder.id)}
                          onExpandedChange={handleSubfolderExpansion}
                          onSelect={memoizedOnSelect}
                          onDragStart={handleDragStart}
                        />
                      ))}
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