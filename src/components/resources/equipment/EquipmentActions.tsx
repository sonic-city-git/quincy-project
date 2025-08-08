import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { useState } from "react";
import { EditEquipmentDialog } from "./EditEquipmentDialog";
import { useEquipment } from "@/hooks/equipment";
import { Equipment } from "@/integrations/supabase/types/equipment";

interface EquipmentActionsProps {
  selectedItems: string[];
  onEquipmentDeleted?: () => void;
}

export function EquipmentActions({ selectedItems, onEquipmentDeleted }: EquipmentActionsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { equipment } = useEquipment();
  
  const selectedEquipment = equipment?.find(item => item.id === selectedItems[0]);

  return (
    <div className="flex items-center gap-2">
      {selectedItems.length === 1 && selectedEquipment && (
        <>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <EditEquipmentDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            equipment={selectedEquipment}
            onEquipmentDeleted={onEquipmentDeleted}
          />
        </>
      )}
    </div>
  );
}