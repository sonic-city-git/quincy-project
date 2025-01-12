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

interface EquipmentIconProps {
  isSynced: boolean;
  isEditingDisabled: boolean;
  onViewEquipment: () => void;
  onSyncEquipment: () => void;
}

export function EquipmentIcon({
  isSynced,
  isEditingDisabled,
  onViewEquipment,
  onSyncEquipment,
}: EquipmentIconProps) {
  const iconClasses = `h-5 w-5 ${isSynced ? 'text-green-500' : 'text-blue-500'}`;

  // If synced or editing is disabled, just show the icon without any interaction
  if (isSynced || isEditingDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center">
              <Package className={iconClasses} />
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
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 p-0"
                >
                  <Package className={iconClasses} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={onViewEquipment}>
                  View equipment list
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSyncEquipment}>
                  Sync from project equipment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Equipment list out of sync
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}