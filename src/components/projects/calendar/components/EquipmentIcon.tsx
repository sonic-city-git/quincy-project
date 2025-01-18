import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EquipmentIconProps {
  isEditingDisabled: boolean;
  sectionTitle?: string;
}

export function EquipmentIcon({
  isEditingDisabled,
  sectionTitle
}: EquipmentIconProps) {
  const iconClasses = "h-6 w-6 text-muted-foreground";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 p-0"
              data-sync-button
              data-section={sectionTitle}
              disabled={isEditingDisabled}
            >
              <Package className={iconClasses} />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Equipment list
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}