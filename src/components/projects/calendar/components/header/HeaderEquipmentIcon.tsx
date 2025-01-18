import { Package } from "lucide-react";
import { BaseEquipmentIcon } from "../equipment/BaseEquipmentIcon";

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
    <BaseEquipmentIcon
      isSynced={sectionSyncStatus === 'synced'}
      onSync={onSyncAllEquipment}
      syncLabel="Sync all equipment"
    />
  );
}