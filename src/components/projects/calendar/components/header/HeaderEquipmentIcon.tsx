import { Package } from "lucide-react";
import { BaseEquipmentIcon } from "../equipment/BaseEquipmentIcon";
import { CalendarEvent } from "@/types/events";

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
  const syncLabel = `Sync ${sectionTitle} equipment`;

  return (
    <BaseEquipmentIcon
      isSynced={sectionSyncStatus === 'synced'}
      onSync={onSyncAllEquipment}
      syncLabel={syncLabel}
      isUnsynced={sectionSyncStatus === 'no-equipment'}
    />
  );
}