/**
 * CONSOLIDATED ENTITY DATA HOOK
 * 
 * Eliminates duplication across useProjects, useEquipment, useCrew, useCustomers, etc.
 * Provides generic data fetching with consistent error handling, caching, and real-time capabilities.
 * 
 * Benefits: ~150+ lines eliminated, consistent API, better maintainability
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

// Generic entity configuration
export interface EntityConfig<T = any> {
  // Required: Table and query configuration
  table: string;
  queryKey: string | string[];
  selectQuery?: string;
  
  // Optional: Query modifiers
  orderBy?: string;
  filters?: Record<string, any>;
  enabled?: boolean;
  
  // Optional: Data transformation
  transform?: (data: any[]) => T[] | Promise<T[]>;
  
  // Optional: Real-time subscriptions
  enableRealtime?: boolean;
  realtimeTable?: string; // Defaults to table if not specified
  
  // Optional: Cache configuration
  staleTime?: number;
  gcTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  retry?: number;
  
  // Optional: Error handling
  errorMessage?: string;
}

// Generic hook result
export interface EntityDataResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Generic entity data fetching hook with optional real-time subscriptions
 */
export function useEntityData<T = any>(config: EntityConfig<T>): EntityDataResult<T> {
  const queryClient = useQueryClient();
  
  // Extract configuration with defaults
  const {
    table,
    queryKey,
    selectQuery = '*',
    orderBy = 'name',
    filters = {},
    enabled = true,
    transform,
    enableRealtime = false,
    realtimeTable = table,
    staleTime = 0,
    gcTime = 0,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    retry = 1,
    errorMessage = `Failed to fetch ${table}`
  } = config;

  // Set up real-time subscription if enabled
  useEffect(() => {
    if (!enableRealtime) return;
    
    const channel = supabase
      .channel(`${realtimeTable}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: realtimeTable
        },
        () => {
          // Invalidate queries based on queryKey type
          if (Array.isArray(queryKey)) {
            queryClient.invalidateQueries({ queryKey });
          } else {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, realtimeTable, enableRealtime, queryKey]);

  // Generic data fetching function
  const fetchData = async (): Promise<T[]> => {
    try {
      // Build query
      let query = supabase
        .from(table)
        .select(selectQuery);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy);
      }

      // Execute query
      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${table}:`, error);
        toast.error(errorMessage);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Apply transformation if provided (supports both sync and async transforms)
      return transform ? await transform(data) : data as T[];
      
    } catch (error) {
      console.error(`Error in ${table} query:`, error);
      toast.error(errorMessage);
      throw error;
    }
  };

  // Use query with configuration
  const queryResult = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: fetchData,
    enabled,
    staleTime,
    gcTime,
    refetchOnMount,
    refetchOnWindowFocus,
    retry
  });

  return {
    data: queryResult.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch
  };
}

/**
 * Specialized hook configurations for common entities
 */
export const EntityConfigs = {
  // Basic entities (no real-time)
  customers: (): EntityConfig => ({
    table: 'customers',
    queryKey: 'customers',
    selectQuery: 'id, name, customer_number, organization_number',
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    errorMessage: "Failed to fetch customers"
  }),

  crewRoles: (): EntityConfig => ({
    table: 'crew_roles',
    queryKey: 'crew-roles',
    selectQuery: '*',
    staleTime: 1000 * 60 * 5, // 5 minutes
    errorMessage: "Failed to fetch crew roles"
  }),

  // Real-time entities
  equipment: (): EntityConfig => ({
    table: 'equipment',
    queryKey: 'equipment',
    selectQuery: `
      *,
      equipment_serial_numbers (
        id,
        equipment_id,
        serial_number,
        status,
        notes,
        created_at,
        updated_at
      )
    `,
    enableRealtime: true,
    refetchOnMount: true,
    errorMessage: "Failed to fetch equipment"
  }),

  projects: (): EntityConfig => ({
    table: 'projects',
    queryKey: 'projects',
    // Note: Will need to import projectBaseQuery from utils
    selectQuery: '*', // Placeholder - will be updated
    enableRealtime: false, // Projects don't currently use real-time
    staleTime: 0,
    gcTime: 0,
    errorMessage: "Failed to fetch projects"
  })
};