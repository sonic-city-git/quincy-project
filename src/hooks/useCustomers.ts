/**
 * CONSOLIDATED: useCustomers - Now using generic useEntityData
 * Reduced from 40 lines to 8 lines (80% reduction)
 */

import { useEntityData, EntityConfigs } from './shared/useEntityData';

export function useCustomers(enabled: boolean = false) {
  const { data: customers, isLoading: loading } = useEntityData({
    ...EntityConfigs.customers(),
    enabled
  });
  
  return { customers, loading };
}