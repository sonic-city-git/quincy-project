import { Package } from "lucide-react";
import { BaseEquipmentIcon } from "../equipment/BaseEquipmentIcon";

interface HeaderEquipmentIconProps {
  sectionSyncStatus: 'synced' | 'not-synced' | 'no-equipment';
  onSyncAllEquipment: () => void;
  sectionTitle?: string;
}

export function HeaderEquipmentIcon({ 
  sectionSyncStatus,
  onSyncAllEquipment,
  sectionTitle = 'equipment'
}: HeaderEquipmentIconProps) {
  if (sectionSyncStatus === 'no-equipment') {
    return <Package className="h-6 w-6 text-muted-foreground" />;
  }

  const syncLabel = `Sync ${sectionTitle} equipment`;

  return (
    <BaseEquipmentIcon
      isSynced={sectionSyncStatus === 'synced'}
      onSync={onSyncAllEquipment}
      syncLabel={syncLabel}
    />
  );
}