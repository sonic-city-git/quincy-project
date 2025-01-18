import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface EquipmentDifference {
  added: any[];
  removed: any[];
  changed: any[];
}

interface EquipmentDifferenceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentDifference: EquipmentDifference;
}

export function EquipmentDifferenceDialog({
  isOpen,
  onOpenChange,
  equipmentDifference,
}: EquipmentDifferenceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Equipment Differences</DialogTitle>
          <DialogDescription>
            Here are the differences between the project and event equipment.
          </DialogDescription>
        </DialogHeader>
        <div>
          <h3 className="font-medium">Added Equipment</h3>
          <ul>
            {equipmentDifference.added.map((item) => (
              <li key={item.id}>
                {item.equipment.name} (Quantity: {item.quantity})
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Removed Equipment</h3>
          <ul>
            {equipmentDifference.removed.map((item) => (
              <li key={item.id}>
                {item.equipment.name} (Quantity: {item.quantity})
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Changed Equipment</h3>
          <ul>
            {equipmentDifference.changed.map((item) => (
              <li key={item.item.id}>
                {item.item.equipment.name} (Old Quantity: {item.oldQuantity}, New Quantity: {item.newQuantity})
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
