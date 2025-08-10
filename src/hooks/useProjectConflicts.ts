/**
 * 📋 PROJECT CONFLICTS - WORLD-CLASS OPTIMIZATION
 * 
 * Optimized for project detail with smart memoization and focused data access.
 * Pre-groups conflicts and provides efficient lookup functions.
 */

import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEquipmentStockEngine } from './useEquipmentStockEngine';
import { 
  ProjectConflictResult, 
  ProjectConflictInfo, 
  EngineError,
  CACHE_STRATEGIES 
} from '@/types/stock-optimized';
import { ConflictAnalysis } from '@/types/stock';

export function useProjectConflicts(projectId: string): ProjectConflictResult {
  // Get project-specific date range and equipment IDs
  const { data: projectScope } = useQuery({
    queryKey: ['project-scope', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID required');
      
      // Get project events to determine date range
      const { data: events, error: eventsError } = await supabase
        .from('project_events')
        .select('date')
        .eq('project_id', projectId)
        .neq('status', 'cancelled')
        .order('date');
      
      if (eventsError) throw eventsError;
      
      // Get project equipment IDs
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('project_event_equipment')
        .select('equipment_id')
        .in('event_id', 
          (await supabase
            .from('project_events')
            .select('id')
            .eq('project_id', projectId)
          ).data?.map(e => e.id) || []
        );
      
      if (equipmentError) throw equipmentError;
      
      if (!events?.length) {
        // No events - use minimal range
        const today = new Date();
        return {
          dateRange: { start: today, end: today },
          equipmentIds: []
        };
      }
      
      // Calculate optimal date range
      const dates = events.map(e => e.date).sort();
      const start = new Date(dates[0]);
      const end = new Date(dates[dates.length - 1]);
      
      // Add small buffer (3 days) for context
      start.setDate(start.getDate() - 3);
      end.setDate(end.getDate() + 3);
      
      return {
        dateRange: { start, end },
        equipmentIds: [...new Set(equipmentData?.map(e => e.equipment_id) || [])]
      };
    },
    enabled: !!projectId,
    ...CACHE_STRATEGIES.project, // Optimized caching for project data
  });

  // Use core engine with project-specific scope
  const {
    conflicts: allConflicts,
    isLoading: stockLoading,
    error: stockError
  } = useEquipmentStockEngine({
    dateRange: projectScope?.dateRange || { start: new Date(), end: new Date() },
    includeConflictAnalysis: true,
    includeSuggestions: false,     // Project detail doesn't need suggestions yet
    cacheResults: false,           // Less caching (project-specific)
    batchSize: 50,                 // Smaller batches for responsiveness
    cacheStrategy: 'project'       // ✅ FIXED: Apply project caching strategy
  });

  // Filter conflicts to only project equipment
  const projectConflicts = useMemo(() => {
    if (!allConflicts?.length || !projectScope?.equipmentIds?.length) {
      return [];
    }
    
    return allConflicts.filter(conflict => 
      projectScope.equipmentIds.includes(conflict.equipmentId)
    );
  }, [allConflicts, projectScope?.equipmentIds]);

  // 🚀 SMART MEMOIZATION: Pre-group conflicts and create optimized lookup functions
  const optimizedConflictData = useMemo(() => {
    const conflictsByDate: Record<string, ConflictAnalysis[]> = {};
    
    // Pre-group conflicts by date for O(1) lookup
    projectConflicts.forEach(conflict => {
      if (!conflictsByDate[conflict.date]) {
        conflictsByDate[conflict.date] = [];
      }
      conflictsByDate[conflict.date].push(conflict);
    });
    
    return {
      conflictsByDate,
      totalConflicts: projectConflicts.length
    };
  }, [projectConflicts]);

  // 🚀 OPTIMIZED LOOKUP FUNCTIONS
  const getConflictsForDate = useCallback((date: string): ConflictAnalysis[] => {
    return optimizedConflictData.conflictsByDate[date] || [];
  }, [optimizedConflictData.conflictsByDate]);

  const getConflictingProjects = useCallback((equipmentId: string, date: string): ProjectConflictInfo[] => {
    const dayConflicts = getConflictsForDate(date);
    const equipmentConflict = dayConflicts.find(c => c.equipmentId === equipmentId);
    
    if (!equipmentConflict) return [];
    
    return equipmentConflict.conflict.affectedEvents.map(event => ({
      projectId: '', // TODO: Add project_id to affected events
      projectName: event.projectName,
      eventName: event.eventName,
      quantity: event.quantity,
      date: date
    }));
  }, [getConflictsForDate]);

  // 🚀 STANDARDIZED ERROR HANDLING
  const engineError: EngineError | null = stockError ? {
    message: stockError.message,
    code: 'FETCH_ERROR',
    details: stockError,
    timestamp: new Date().toISOString()
  } : null;

  return {
    conflicts: projectConflicts,
    conflictsByDate: optimizedConflictData.conflictsByDate,
    getConflictsForDate,
    getConflictingProjects,
    totalConflicts: optimizedConflictData.totalConflicts,
    isLoading: !projectScope || stockLoading,
    error: engineError
  };
}
