import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface EquipmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentDifference: EquipmentDifference;
}

export function EquipmentDialog({ 
  isOpen, 
  onOpenChange, 
  equipmentDifference 
}: EquipmentDialogProps) {
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
            <Card 
              key={item.id} 
              className={`p-2 ${
                type === 'added' 
                  ? 'border-l-4 border-l-green-500' 
                  : 'border-l-4 border-l-red-500'
              }`}
            >
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Equipment Changes</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="changes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="added" className="text-green-500">
              Added ({equipmentDifference.added.length})
            </TabsTrigger>
            <TabsTrigger value="changed" className="text-blue-500">
              Changed ({equipmentDifference.changed.length})
            </TabsTrigger>
            <TabsTrigger value="removed" className="text-red-500">
              Removed ({equipmentDifference.removed.length})
            </TabsTrigger>
          </TabsList>
          <ScrollArea className="max-h-[60vh] mt-4">
            <TabsContent value="added" className="mt-0">
              {equipmentDifference.added.length > 0 ? (
                renderEquipmentList(equipmentDifference.added, 'added')
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No equipment added
                </p>
              )}
            </TabsContent>
            <TabsContent value="changed" className="mt-0">
              {equipmentDifference.changed.length > 0 ? (
                renderChangedEquipmentList(equipmentDifference.changed)
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No equipment quantities changed
                </p>
              )}
            </TabsContent>
            <TabsContent value="removed" className="mt-0">
              {equipmentDifference.removed.length > 0 ? (
                renderEquipmentList(equipmentDifference.removed, 'removed')
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No equipment removed
                </p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}