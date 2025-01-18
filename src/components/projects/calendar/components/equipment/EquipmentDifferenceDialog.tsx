import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface EquipmentItem {
  id: string;
  quantity: number;
  equipment: {
    name: string;
    code: string | null;
  };
  group: {
    name: string;
  } | null;
}

interface EquipmentDifference {
  added: EquipmentItem[];
  removed: EquipmentItem[];
  changed: {
    item: EquipmentItem;
    oldQuantity: number;
    newQuantity: number;
  }[];
}

interface EquipmentDifferenceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentDifference: EquipmentDifference;
}

export function EquipmentDifferenceDialog({
  isOpen,
  onOpenChange,
  equipmentDifference
}: EquipmentDifferenceDialogProps) {
  const renderEquipmentList = (items: EquipmentItem[], type: 'added' | 'removed') => {
    const groupedEquipment = items.reduce((acc, item) => {
      const groupName = item.group?.name || 'Ungrouped';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(item);
      return acc;
    }, {} as Record<string, EquipmentItem[]>);

    return Object.entries(groupedEquipment).map(([groupName, items]) => (
      <div key={groupName} className="mb-4">
        <h3 className="text-sm font-medium mb-2 px-2 py-1 bg-secondary/10 rounded-md">
          {groupName}
        </h3>
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} className={`p-2 border-l-4 ${type === 'added' ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {item.equipment.name}
                  {item.equipment.code && (
                    <span className="text-muted-foreground ml-1">
                      ({item.equipment.code})
                    </span>
                  )}
                </span>
                <span className="text-sm text-muted-foreground">
                  Qty: {item.quantity}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    ));
  };

  const renderChangedEquipmentList = (items: EquipmentDifference['changed']) => {
    const groupedEquipment = items.reduce((acc, { item }) => {
      const groupName = item.group?.name || 'Ungrouped';
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(item);
      return acc;
    }, {} as Record<string, EquipmentItem[]>);

    return Object.entries(groupedEquipment).map(([groupName, groupItems]) => (
      <div key={groupName} className="mb-4">
        <h3 className="text-sm font-medium mb-2 px-2 py-1 bg-secondary/10 rounded-md">
          {groupName}
        </h3>
        <div className="space-y-2">
          {items
            .filter(({ item }) => (item.group?.name || 'Ungrouped') === groupName)
            .map(({ item, oldQuantity, newQuantity }) => (
              <Card key={item.id} className="p-2 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {item.equipment.name}
                    {item.equipment.code && (
                      <span className="text-muted-foreground ml-1">
                        ({item.equipment.code})
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Qty: {oldQuantity} → {newQuantity}
                  </span>
                </div>
              </Card>
            ))}
        </div>
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <DialogContent 
        className="max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Equipment List Differences</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-4">
            {equipmentDifference.added.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-green-500 mb-4">Added Equipment</h2>
                {renderEquipmentList(equipmentDifference.added, 'added')}
              </div>
            )}
            {equipmentDifference.changed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-blue-500 mb-4">Qty Changed</h2>
                {renderChangedEquipmentList(equipmentDifference.changed)}
              </div>
            )}
            {equipmentDifference.removed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-red-500 mb-4">Removed Equipment</h2>
                {renderEquipmentList(equipmentDifference.removed, 'removed')}
              </div>
            )}
            {equipmentDifference.added.length === 0 && 
             equipmentDifference.removed.length === 0 && 
             equipmentDifference.changed.length === 0 && (
              <p className="text-center text-muted-foreground">No differences found in equipment lists</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}