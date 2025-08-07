import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ProjectEquipment } from "@/types/equipment";

// Extended interface to include folder_id
interface ProjectEquipmentWithFolder extends ProjectEquipment {
  folder_id?: string;
}
import { ProjectEquipmentItem } from "./EquipmentItem";
import { formatPrice } from "@/utils/priceFormatters";
import { FOLDER_ORDER } from "@/types/equipment";
import { useFolders } from "@/hooks/useFolders";
import { useMemo, useEffect } from "react";
import { 
  COMPONENT_CLASSES, 
  FORM_PATTERNS,
  cn 
} from "@/design-system";

interface EquipmentGroupProps {
  id: string;
  name: string;
  equipment: ProjectEquipmentWithFolder[];
  isSelected: boolean;
  totalPrice: number;
  onSelect: () => void;
  onDelete: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveEquipment: (id: string) => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => Promise<void>;
  compact?: boolean; // NEW: Support for compact layout
  scrollToItemId?: string; // ID of item to scroll to
}

export function EquipmentGroup({
  id,
  name,
  equipment,
  isSelected,
  totalPrice,
  onSelect,
  onDelete,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveEquipment,
  onUpdateQuantity,
  compact = false,
  scrollToItemId
}: EquipmentGroupProps) {
  const { folders = [] } = useFolders();

  // Scroll to specific item when scrollToItemId changes
  useEffect(() => {
    if (scrollToItemId) {
      // Try to find equipment item first, then group
      let element = document.getElementById(`equipment-${scrollToItemId}`);
      if (!element) {
        element = document.getElementById(`group-${scrollToItemId}`);
      }
      
      if (element) {
        // Check if element is already in view
        const rect = element.getBoundingClientRect();
        const container = element.closest('[class*="overflow-y-auto"]');
        const containerRect = container ? container.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
        
        const isInView = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
        
        let highlightTriggered = false;
        
        const triggerHighlight = () => {
          if (highlightTriggered) return;
          highlightTriggered = true;
          
          // Find the item name element
          const nameElement = element.querySelector('h3');
          
          // Add highlight effect
          element.style.transform = 'scale(1.02)';
          element.style.transition = 'transform 0.2s ease';
          
          // Highlight the name color
          if (nameElement) {
            nameElement.style.color = 'hsl(var(--primary))';
            nameElement.style.transition = 'color 0.2s ease';
          }
          
          setTimeout(() => {
            element.style.transform = 'scale(1)';
            // Reset name color
            if (nameElement) {
              nameElement.style.color = '';
            }
          }, 300);
        };
        
        if (isInView) {
          // Element is already visible, trigger highlight immediately
          triggerHighlight();
        } else {
          // Element needs scrolling
          const scrollContainer = container || window;
          
          const handleScrollEnd = () => {
            triggerHighlight();
            
            // Clean up listeners
            if (scrollContainer === window) {
              window.removeEventListener('scrollend', handleScrollEnd);
            } else {
              scrollContainer.removeEventListener('scrollend', handleScrollEnd);
            }
            clearTimeout(fallbackTimer);
          };
          
          // Add scroll end listener
          if (scrollContainer === window) {
            window.addEventListener('scrollend', handleScrollEnd, { once: true });
          } else {
            scrollContainer.addEventListener('scrollend', handleScrollEnd, { once: true });
          }
          
          // Fallback timeout in case scrollend doesn't fire
          const fallbackTimer = setTimeout(() => {
            triggerHighlight();
          }, 1000);
          
          // Start the scroll
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
          
          // Cleanup function
          return () => {
            if (scrollContainer === window) {
              window.removeEventListener('scrollend', handleScrollEnd);
            } else {
              scrollContainer.removeEventListener('scrollend', handleScrollEnd);
            }
            clearTimeout(fallbackTimer);
          };
        }
      }
    }
  }, [scrollToItemId]);

  // Group equipment by folder and sort by FOLDER_ORDER
  const equipmentByFolder = useMemo(() => {
    // Group equipment by folder_id
    const grouped = equipment.reduce((acc, item) => {
      const folderId = item.folder_id || 'unknown';
      
      if (!acc[folderId]) {
        acc[folderId] = [];
      }
      acc[folderId].push(item);
      return acc;
    }, {} as Record<string, ProjectEquipmentWithFolder[]>);

    // Group by main folder (parent folder) and sort by FOLDER_ORDER
    const mainFolderGroups: Record<string, ProjectEquipmentWithFolder[]> = {};
    
    Object.entries(grouped).forEach(([folderId, equipmentItems]) => {
      const folder = folders.find(f => f.id === folderId);
      
      // Find the main folder (parent folder)
      let mainFolder = folder;
      if (folder?.parent_id) {
        mainFolder = folders.find(f => f.id === folder.parent_id) || folder;
      }
      
      const mainFolderName = mainFolder?.name || 'Unknown';
      
      if (!mainFolderGroups[mainFolderName]) {
        mainFolderGroups[mainFolderName] = [];
      }
      
      // Sort equipment items alphabetically by name before adding
      const sortedEquipmentItems = equipmentItems.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      mainFolderGroups[mainFolderName].push(...sortedEquipmentItems);
    });

    // Sort main folders by FOLDER_ORDER and equipment within folders alphabetically
    const sortedFolders = Object.entries(mainFolderGroups).map(([folderName, equipment]) => ({
      folderId: folderName, // Use folder name as ID for main folders
      folderName,
      equipment: equipment.sort((a, b) => a.name.localeCompare(b.name)), // Final alphabetical sort
      sortIndex: FOLDER_ORDER.indexOf(folderName as any)
    })).sort((a, b) => {
      if (a.sortIndex === -1 && b.sortIndex === -1) {
        return a.folderName.localeCompare(b.folderName);
      }
      if (a.sortIndex === -1) return 1;
      if (b.sortIndex === -1) return -1;
      return a.sortIndex - b.sortIndex;
    });

    return sortedFolders;
  }, [equipment, folders]);
  return (
    <div 
      id={`group-${id}`}
      className={cn(
        "relative mb-1.5 rounded-lg transition-all duration-300",
        "border-2", // Simple consistent border
        isSelected 
          ? "border-primary bg-primary/5" 
          : "border-border/20 hover:border-border/40"
      )}>
      {/* Group Header */}
      <div 
        className={cn(
          "transition-all duration-300 relative select-none cursor-pointer", // Prevent text selection on header
          "rounded-t-lg border-b border-border/30", // Simple top rounded corners with bottom border
          "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500", // Solid grey backgrounds
          compact ? "p-1" : "p-1.5"
        )}
        onClick={onSelect}>
        <div className="flex items-center justify-between" style={{ userSelect: 'none' }}>
          {/* Group Name - Display Only */}
          <div
            className={cn(
              "flex-1 text-left", 
              "select-none", // Remove all button styling
              "text-foreground font-medium"
            )}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }} // Extra prevention
          >
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-200 border-2 flex-shrink-0",
                "bg-muted-foreground/30 border-muted-foreground/40"
              )} />
              <h3 className={cn(
                "leading-tight select-none font-semibold tracking-tight", 
                compact ? "text-sm" : "text-sm"
              )}>
                {name}
              </h3>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md transition-colors font-medium select-none flex-shrink-0 leading-none",
                compact ? "hidden" : "block",
                "text-muted-foreground/80 bg-muted/50"
              )}>
                {equipment.length}
              </span>
            </div>
          </div>
          
          {/* Group Actions */}
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "text-right",
              compact ? "min-w-[55px]" : "min-w-[70px]"
            )}>
              <div className={cn(
                "font-bold text-foreground tracking-tight leading-none",
                compact ? "text-xs" : "text-sm"
              )}>
                {formatPrice(totalPrice)}
              </div>
              {!compact && equipment.length > 0 && (
                <div className="text-xs text-muted-foreground/70 leading-none mt-0.5 font-medium">
                  {equipment.length} items
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className={cn(
                "p-0 transition-all duration-200 rounded-md",
                "text-muted-foreground/50 hover:text-white",
                "hover:bg-destructive hover:shadow-sm focus:bg-destructive focus:text-white",
                "opacity-40 hover:opacity-100 focus:opacity-100",
                "border border-transparent hover:border-destructive/20",
                compact ? "h-6 w-6" : "h-7 w-7"
              )}
              aria-label={`Delete ${name} group`}
            >
              <X className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Equipment Content */}
      <div 
        className={cn(
          "transition-all duration-300 relative rounded-b-lg",
          compact ? "p-1" : "p-1.5",
          "min-h-[30px]" // Ensure minimum height for drop zones
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        role="group"
        aria-label={`Equipment group: ${name}`}
      >
        {equipment.length > 0 ? (
          <div className="space-y-2">
            {equipmentByFolder.map((folderGroup) => (
              <div key={folderGroup.folderId} className="space-y-1">
                {/* Sub-header for folder */}
                {equipmentByFolder.length > 1 && (
                  <div className={cn(
                    "flex items-center gap-2 ml-3 px-2 py-1 rounded-md bg-muted/20 border border-muted/30",
                    compact ? "py-0.5 ml-2" : "py-1 ml-3"
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                    <h4 className={cn(
                      "font-medium text-muted-foreground leading-none",
                      compact ? "text-xs" : "text-sm"
                    )}>
                      {folderGroup.folderName}
                    </h4>
                  </div>
                )}
                
                {/* Equipment items for this folder */}
                <div className="space-y-0.5">
                  {folderGroup.equipment.map((item) => (
                    <div 
                      key={item.id} 
                      id={`equipment-${item.id}`}
                      className="transition-all duration-200"
                    >
                      <ProjectEquipmentItem
                        item={item}
                        onRemove={() => onRemoveEquipment(item.id)}
                        onUpdateQuantity={onUpdateQuantity}
                        onSelect={onSelect}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center text-muted-foreground transition-all duration-200",
            "border-2 border-dashed border-muted/40 rounded-lg",
            "hover:border-primary/40 hover:bg-primary/5",
            compact ? "py-3" : "py-6"
          )}>
            <div className={cn(
              "w-6 h-6 rounded-full bg-muted/40 flex items-center justify-center mb-1",
              compact && "w-5 h-5 mb-1"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 bg-muted-foreground/60 rounded-full",
                compact && "w-1 h-1"
              )} />
            </div>
            <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
              No equipment in this group
            </p>
            <p className={cn("mt-0.5 text-center max-w-xs text-xs", compact && "text-xs")}>
              Drag equipment items here to add them
            </p>
          </div>
        )}
      </div>
    </div>
  );
}