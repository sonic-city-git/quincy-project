import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderEquipmentIconProps {
  sectionSyncStatus: 'synced' | 'not-synced' | 'no-equipment';
  onSyncAllEquipment: () => void;
}

export function HeaderEquipmentIcon({ 
  sectionSyncStatus,
  onSyncAllEquipment 
}: HeaderEquipmentIconProps) {
  if (sectionSyncStatus === 'no-equipment') {
    return <Package className="h-6 w-6 text-muted-foreground" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 p-0"
        >
          <Package 
            className={`h-6 w-6 ${
              sectionSyncStatus === 'synced'
                ? 'text-green-500' 
                : 'text-blue-500'
            }`} 
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onSyncAllEquipment}>
          Sync all equipment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}