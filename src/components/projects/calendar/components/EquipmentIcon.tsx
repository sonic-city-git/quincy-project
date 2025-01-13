import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface EquipmentIconProps {
  isSynced: boolean;
  isEditingDisabled: boolean;
  onViewEquipment: () => void;
  onSyncEquipment: () => void;
  sectionTitle?: string;
}

export function EquipmentIcon({
  isSynced,
  isEditingDisabled,
  onViewEquipment,
  onSyncEquipment,
  sectionTitle
}: EquipmentIconProps) {
  const iconClasses = `h-6 w-6 ${isSynced ? 'text-green-500' : 'text-blue-500'}`;
  const badgeClasses = "bg-blue-500/10 text-blue-500 whitespace-nowrap";

  if (isSynced || isEditingDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Package className={iconClasses} />
              {!isSynced && !isEditingDisabled && (
                <Badge variant="secondary" className={badgeClasses}>
                  Out of sync
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isSynced ? "Equipment list is synced" : "Equipment list out of sync"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 p-0"
                  data-sync-button
                  data-section={sectionTitle}
                >
                  <Package className={iconClasses} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={onViewEquipment}>
                  View equipment changes
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onSyncEquipment}
                  className="text-blue-500 font-medium"
                >
                  Sync from project equipment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="secondary" className={badgeClasses}>
              Out of sync
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Equipment list out of sync
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}