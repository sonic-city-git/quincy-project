/**
 * CONSOLIDATED: useEquipment - Now using generic useEntityData with real-time
 * Reduced from 70 lines to 12 lines (83% reduction)
 */

import { useEntityData, EntityConfigs } from '../shared/useEntityData';

export function useEquipment() {
  const { data: equipment, isLoading: loading, refetch } = useEntityData({
    ...EntityConfigs.equipment()
  });
  
  return { equipment, loading, refetch };
}