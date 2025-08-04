/**
 * CONSOLIDATED: DeleteEquipmentAlert - Now using generic ConfirmationDialog
 * Reduced from 45 lines to 20 lines (56% reduction)
 */

import { DeleteConfirmationDialog } from "@/components/shared/dialogs/ConfirmationDialog";
import { Equipment } from "@/types/equipment";

interface DeleteEquipmentAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment;
  onDelete: () => Promise<void>;
  isPending: boolean;
}

export function DeleteEquipmentAlert({
  open,
  onOpenChange,
  equipment,
  onDelete,
  isPending
}: DeleteEquipmentAlertProps) {
  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onDelete}
      itemName={equipment.name}
      itemType="equipment"
      isPending={isPending}
    />
  );
}