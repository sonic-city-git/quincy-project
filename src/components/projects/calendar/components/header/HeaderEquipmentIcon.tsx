import { BaseEquipmentIcon } from "../equipment/BaseEquipmentIcon";

interface HeaderEquipmentIconProps {
  sectionSyncStatus: 'synced' | 'not-synced' | 'no-equipment';
  onSyncAllEquipment: () => void;
  sectionTitle?: string;
  hasProjectEquipment: boolean;
}

export function HeaderEquipmentIcon({ 
  sectionSyncStatus,
  onSyncAllEquipment,
  sectionTitle = 'equipment',
  hasProjectEquipment
}: HeaderEquipmentIconProps) {
  // If project has no equipment, don't show the icon
  if (!hasProjectEquipment) {
    return null;
  }

  const syncLabel = `Sync ${sectionTitle} equipment`;

  return (
    <BaseEquipmentIcon
      isSynced={sectionSyncStatus === 'synced'}
      onSync={onSyncAllEquipment}
      syncLabel={syncLabel}
      isUnsynced={sectionSyncStatus === 'no-equipment'}
      hasProjectEquipment={hasProjectEquipment}
    />
  );
}