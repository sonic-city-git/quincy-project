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
  hasEventEquipment: boolean;
  isSynced: boolean;
  isEditingDisabled: boolean;
  onViewEquipment: () => void;
  onSyncEquipment: () => void;
}

export function EquipmentIcon({
  hasEventEquipment,
  isSynced,
  isEditingDisabled,
  onViewEquipment,
  onSyncEquipment
}: EquipmentIconProps) {
  const getEquipmentIcon = () => {
    if (!hasEventEquipment) {
      return <Package className="h-6 w-6 text-gray-400" />;
    }
    if (!isSynced) {
      return <Package className="h-6 w-6 text-blue-500" />;
    }
    return <Package className="h-6 w-6 text-green-500" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {isEditingDisabled ? (
              getEquipmentIcon()
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    disabled={isEditingDisabled}
                  >
                    {getEquipmentIcon()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {!hasEventEquipment && !isEditingDisabled && (
                    <DropdownMenuItem onClick={onSyncEquipment}>
                      Sync from project equipment
                    </DropdownMenuItem>
                  )}
                  {!isSynced && !isEditingDisabled && (
                    <>
                      <DropdownMenuItem onClick={onViewEquipment}>
                        View equipment list
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onSyncEquipment}>
                        Sync from project equipment
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {hasEventEquipment && isSynced 
            ? "Equipment list is NSYNC" 
            : !hasEventEquipment 
              ? "No equipment assigned"
              : "Equipment list out of sync"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}