import { CalendarEvent } from "@/types/events";
import { useSyncStatus } from "./sync/useSyncStatus";
import { useSyncOperations } from "./sync/useSyncOperations";

export function useEquipmentSync(event: CalendarEvent) {
  const { isSynced, checkSyncStatus } = useSyncStatus(event);
  const { handleEquipmentSync } = useSyncOperations(event);

  return {
    isSynced,
    checkSyncStatus,
    handleEquipmentSync
  };
}