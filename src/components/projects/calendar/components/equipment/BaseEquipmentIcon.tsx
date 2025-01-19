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

interface BaseEquipmentIconProps {
  isSynced: boolean;
  isDisabled?: boolean;
  onViewDifferences?: () => void;
  onSync: () => void;
  syncLabel?: string;
}

export function BaseEquipmentIcon({
  isSynced,
  isDisabled,
  onViewDifferences,
  onSync,
  syncLabel = "Sync equipment"
}: BaseEquipmentIconProps) {
  if (isSynced) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-10 w-10 flex items-center justify-center">
              <Package className="text-green-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Equipment is synced</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 p-0"
                disabled={isDisabled}
              >
                <Package className="text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {onViewDifferences && (
                <DropdownMenuItem onClick={onViewDifferences}>
                  View differences
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onSync}>
                {syncLabel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          <p>Equipment out of sync</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}