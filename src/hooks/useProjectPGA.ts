import { useQuery } from "@tanstack/react-query";
import { calculateProjectPGA, calculateBatchPGA } from "@/utils/pgaCalculation";

/**
 * Hook to calculate and cache PGA for a single project
 */
export function useProjectPGA(projectId: string | null) {
  return useQuery({
    queryKey: ['project-pga', projectId],
    queryFn: () => projectId ? calculateProjectPGA(projectId) : null,
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to calculate and cache PGA for multiple projects efficiently
 */
export function useBatchProjectPGA(projectIds: string[]) {
  return useQuery({
    queryKey: ['batch-project-pga', projectIds.sort()],
    queryFn: () => calculateBatchPGA(projectIds),
    enabled: projectIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}