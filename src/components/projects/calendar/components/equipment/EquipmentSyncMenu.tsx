import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
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

interface EquipmentSyncMenuProps {
  isEditingDisabled: boolean;
  isChecking: boolean;
  isSynced: boolean;
  onViewDifferences: () => void;
  onSync: () => void;
}

export function EquipmentSyncMenu({
  isEditingDisabled,
  isChecking,
  isSynced,
  onViewDifferences,
  onSync,
}: EquipmentSyncMenuProps) {
  const getIconColor = () => {
    if (isSynced) return "text-green-500";
    return "text-blue-500";
  };

  const getTooltipText = () => {
    if (isChecking) return "Checking sync status...";
    if (isSynced) return "Equipment is NSYNC";
    return "Equipment out of sync";
  };

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
                disabled={isEditingDisabled || isChecking}
              >
                <Package className={`h-6 w-6 ${getIconColor()}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={onViewDifferences}>
                View differences
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onSync}>
                Sync equipment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}