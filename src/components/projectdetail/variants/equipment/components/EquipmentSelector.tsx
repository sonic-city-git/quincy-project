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

export function EquipmentSelector({ onSelect, className, stickySearch = false, searchQuery: externalSearchQuery }: EquipmentSelectorProps) {
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
        const indexA = FOLDER_ORDER.indexOf(a.name as any);
        const indexB = FOLDER_ORDER.indexOf(b.name as any);
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

    // Determine which folders should be expanded based on search results or manual expansion
  const autoExpandedFolders = useMemo(() => {
    if (!searchQuery) return [];
    
    return Object.entries(groupedByParent).reduce((acc: string[], [folderId, folder]) => {
      const typedFolder = folder as { name: string; items: Equipment[]; subfolders: Record<string, { name: string; items: Equipment[] }> };
      const hasMatchingItems = typedFolder.items.length > 0;
      const hasMatchingSubfolders = Object.values(typedFolder.subfolders).some(
        subfolder => subfolder.items.length > 0
      );

      if (hasMatchingItems || hasMatchingSubfolders) {
        acc.push(folderId);
      }
      return acc;
    }, []);
  }, [groupedByParent, searchQuery]);

  // Combine auto-expanded and manually expanded folders
  const allExpandedFolders = useMemo(() => {
    return [...new Set([...autoExpandedFolders, ...expandedFolders])];
  }, [autoExpandedFolders, expandedFolders]);

  // Handle folder expansion with Cmd+click support
  const handleFolderToggle = useCallback((folderId: string, isCtrlClick: boolean = false) => {
    if (isCtrlClick) {
      // Cmd+click: expand/collapse this folder and all its subfolders instantly
      setExpandedFolders(prev => {
        const folderData = groupedByParent[folderId];
        if (!folderData) return prev;
        
        const subfolderIds = Object.keys(folderData.subfolders);
        const allRelatedIds = [folderId, ...subfolderIds];
        
        // If all are expanded, collapse all; otherwise expand all
        const allExpanded = allRelatedIds.every(id => prev.includes(id) || autoExpandedFolders.includes(id));
        
        if (allExpanded) {
          // Remove all related folders instantly
          return prev.filter(id => !allRelatedIds.includes(id));
        } else {
          // Add all related folders instantly
          return [...new Set([...prev, ...allRelatedIds])];
        }
      });
    } else {
      // Normal click: toggle just this folder
      setExpandedFolders(prev => {
        const isCurrentlyExpanded = prev.includes(folderId) || autoExpandedFolders.includes(folderId);
        if (isCurrentlyExpanded) {
          return prev.filter(id => id !== folderId);
        } else {
          return [...prev, folderId];
        }
      });
    }
  }, [groupedByParent, autoExpandedFolders]);

  const renderEquipmentCard = (item: Equipment) => (
    <Card
      key={item.id}
      className={cn(
        COMPONENT_CLASSES.card.hover,
        "cursor-move group transition-all duration-200",
        "border-l-4 border-l-transparent hover:border-l-primary",
        "py-1 px-2"
      )}
      draggable
      onDragStart={(e) => handleDragStart(e, item)}
      onDoubleClick={() => onSelect(item)}
      role="button"
      tabIndex={0}
      aria-label={`Add ${item.name} to variant. Double-click or drag to add.`}
    >
      <div className="flex items-center justify-between h-full gap-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="w-1 h-1 rounded-full bg-muted-foreground/50 group-hover:bg-primary/70 transition-colors flex-shrink-0" />
          <h3 className="text-xs font-medium leading-tight text-foreground group-hover:text-primary transition-colors truncate flex-1 min-w-0">
            {item.name}
          </h3>
          {item.code && (
            <span className="text-xs text-muted-foreground/70 font-mono bg-muted/40 px-1 py-0.5 rounded leading-none whitespace-nowrap">
              {item.code}
            </span>
          )}
        </div>
        {item.rental_price && (
          <div className="text-xs text-muted-foreground/80 font-medium flex-shrink-0 whitespace-nowrap">
            {formatPrice(item.rental_price)}
          </div>
        )}
      </div>
    </Card>
  );

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
        <div className="px-4 pt-2 pb-4">
          <Accordion 
            type="multiple" 
            className="space-y-2"
            value={allExpandedFolders}
            onValueChange={setExpandedFolders}
          >
            {sortedMainFolders.map(mainFolder => {
              const folderContent = groupedByParent[mainFolder.id];
              if (!folderContent) return null;

              return (
                <AccordionItem key={mainFolder.id} value={mainFolder.id} className="border-none">
                  <AccordionTrigger 
                    className="py-2 px-3 hover:no-underline rounded-md hover:bg-muted/50 data-[state=open]:bg-muted/50"
                    title={`Click to toggle ${mainFolder.name}. Cmd+click to expand/collapse all subfolders with animation.`}
                    onClick={(e) => {
                      const isCtrlClick = e.metaKey || e.ctrlKey;
                      if (isCtrlClick) {
                        e.preventDefault();
                        handleFolderToggle(mainFolder.id, true);
                      }
                    }}
                  >
                    <span className="text-sm font-medium text-muted-foreground">
                      {mainFolder.name}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pt-1 px-2">
                    <div className="space-y-1">
                      {/* Main folder items */}
                      {folderContent.items.length > 0 && (
                        <div className="space-y-0.5">
                          {folderContent.items.map(renderEquipmentCard)}
                        </div>
                      )}
                      
                      {/* Subfolders */}
                      {getSubfolders(mainFolder.id).map(subfolder => {
                        const subfolderContent = folderContent.subfolders[subfolder.id];
                        if (!subfolderContent?.items.length) return null;

                        return (
                          <Collapsible 
                            key={subfolder.id} 
                            open={allExpandedFolders.includes(subfolder.id) || searchQuery.length > 0}
                            onOpenChange={(open) => {
                              if (open) {
                                setExpandedFolders(prev => [...prev, subfolder.id]);
                              } else {
                                setExpandedFolders(prev => prev.filter(id => id !== subfolder.id));
                              }
                            }}
                          >
                            <CollapsibleTrigger 
                              className="flex items-center gap-2 text-sm font-medium text-muted-foreground w-full hover:bg-muted/50 py-1 rounded-md transition-colors mt-1"
                              title={`Click to toggle ${subfolder.name} subfolder`}
                              onClick={(e) => {
                                const isCtrlClick = e.metaKey || e.ctrlKey;
                                if (isCtrlClick) {
                                  e.preventDefault();
                                  // For subfolders, Cmd+click just toggles them since they don't have sub-subfolders
                                  const isCurrentlyExpanded = allExpandedFolders.includes(subfolder.id);
                                  if (isCurrentlyExpanded) {
                                    setExpandedFolders(prev => prev.filter(id => id !== subfolder.id));
                                  } else {
                                    setExpandedFolders(prev => [...prev, subfolder.id]);
                                  }
                                }
                              }}
                            >
                              <ChevronDown className="h-4 w-4" />
                              {subfolder.name}
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="space-y-0.5 pl-4 pt-1">
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