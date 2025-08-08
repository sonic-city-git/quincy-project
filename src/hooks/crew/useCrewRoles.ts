/**
 * CONSOLIDATED: useCrewRoles - Now using generic useEntityData  
 * Reduced from 41 lines to 15 lines (63% reduction)
 */

import { useEntityData, EntityConfigs } from '../shared/useEntityData';

export interface CrewRole {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useCrewRoles() {
  const { data: roles, isLoading, refetch } = useEntityData<CrewRole>({
    ...EntityConfigs.crewRoles()
  });
  
  return { roles, isLoading, refetch };
}