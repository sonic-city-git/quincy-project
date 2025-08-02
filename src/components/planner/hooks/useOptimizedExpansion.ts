/**
 * OPTIMIZED EXPANSION HOOK - Performance-focused expansion management
 * 
 * Key optimizations:
 * 1. Batched expansion operations
 * 2. Animation frame scheduling
 * 3. Precomputed layout calculations
 * 4. Smart state updates
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { LAYOUT } from '../constants';

interface UseOptimizedExpansionProps {
  equipmentProjectUsage: Map<string, any>;
}

export function useOptimizedExpansion({ equipmentProjectUsage }: UseOptimizedExpansionProps) {
  const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());
  const [pendingExpansions, setPendingExpansions] = useState<Set<string>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  
  // OPTIMIZATION 1: Precompute layout data to avoid repeated calculations
  const layoutCache = useMemo(() => {
    const cache = new Map<string, { 
      equipmentHeight: number;
      projectHeight: number;
      totalHeight: number;
      projectCount: number;
    }>();
    
    equipmentProjectUsage.forEach((usage, equipmentId) => {
      const projectCount = usage.projectNames.length;
      const equipmentHeight = LAYOUT.EQUIPMENT_ROW_HEIGHT;
      const projectHeight = projectCount * LAYOUT.PROJECT_ROW_HEIGHT;
      const totalHeight = equipmentHeight + projectHeight;
      
      cache.set(equipmentId, {
        equipmentHeight,
        projectHeight,
        totalHeight,
        projectCount
      });
    });
    
    return cache;
  }, [equipmentProjectUsage]);
  
  // OPTIMIZATION 2: Batch expansion operations to prevent layout thrashing
  const flushPendingExpansions = useCallback(() => {
    if (pendingExpansions.size === 0) return;
    
    setExpandedEquipment(prev => {
      const newSet = new Set(prev);
      pendingExpansions.forEach(equipmentId => {
        if (newSet.has(equipmentId)) {
          newSet.delete(equipmentId);
        } else {
          newSet.add(equipmentId);
        }
      });
      return newSet;
    });
    
    setPendingExpansions(new Set());
  }, [pendingExpansions]);
  
  // OPTIMIZATION 3: Schedule batched updates using animation frames
  const scheduleExpansionUpdate = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      flushPendingExpansions();
      animationFrameRef.current = null;
    });
  }, [flushPendingExpansions]);
  
  // OPTIMIZATION 4: Smart toggle with batching support
  const toggleEquipmentExpansion = useCallback((equipmentId: string) => {
    setPendingExpansions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(equipmentId)) {
        newSet.delete(equipmentId);
      } else {
        newSet.add(equipmentId);
      }
      return newSet;
    });
    
    scheduleExpansionUpdate();
  }, [scheduleExpansionUpdate]);
  
  // OPTIMIZATION 5: Batch multiple expansions
  const batchToggleExpansion = useCallback((equipmentIds: string[]) => {
    setPendingExpansions(prev => {
      const newSet = new Set(prev);
      equipmentIds.forEach(id => {
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      });
      return newSet;
    });
    
    scheduleExpansionUpdate();
  }, [scheduleExpansionUpdate]);
  
  // OPTIMIZATION 6: Expand/collapse all with smart batching
  const toggleAllExpansion = useCallback((expand: boolean) => {
    if (expand) {
      // Expand all equipment with projects
      const equipmentWithProjects = Array.from(equipmentProjectUsage.keys())
        .filter(id => (equipmentProjectUsage.get(id)?.projectNames.length || 0) > 0);
      
      setExpandedEquipment(new Set(equipmentWithProjects));
    } else {
      // Collapse all
      setExpandedEquipment(new Set());
    }
    
    setPendingExpansions(new Set());
  }, [equipmentProjectUsage]);
  
  // OPTIMIZATION 7: Get computed layout data efficiently
  const getEquipmentLayoutData = useCallback((equipmentId: string) => {
    return layoutCache.get(equipmentId) || {
      equipmentHeight: LAYOUT.EQUIPMENT_ROW_HEIGHT,
      projectHeight: 0,
      totalHeight: LAYOUT.EQUIPMENT_ROW_HEIGHT,
      projectCount: 0
    };
  }, [layoutCache]);
  
  // OPTIMIZATION 8: Check if equipment is expanded (considering pending changes)
  const isEquipmentExpanded = useCallback((equipmentId: string) => {
    const currentlyExpanded = expandedEquipment.has(equipmentId);
    const pendingToggle = pendingExpansions.has(equipmentId);
    
    return pendingToggle ? !currentlyExpanded : currentlyExpanded;
  }, [expandedEquipment, pendingExpansions]);
  
  // OPTIMIZATION 9: Get total height for virtualization
  const getTotalHeight = useCallback((equipmentIds: string[]) => {
    return equipmentIds.reduce((total, id) => {
      const layout = getEquipmentLayoutData(id);
      const isExpanded = isEquipmentExpanded(id);
      return total + layout.equipmentHeight + (isExpanded ? layout.projectHeight : 0);
    }, 0);
  }, [getEquipmentLayoutData, isEquipmentExpanded]);
  
  return {
    expandedEquipment,
    pendingExpansions,
    layoutCache,
    
    // Actions
    toggleEquipmentExpansion,
    batchToggleExpansion,
    toggleAllExpansion,
    
    // Utilities
    getEquipmentLayoutData,
    isEquipmentExpanded,
    getTotalHeight,
    
    // Performance metrics
    hasPendingChanges: pendingExpansions.size > 0,
    expandedCount: expandedEquipment.size,
  };
}

/**
 * Performance monitoring hook for expansion operations
 */
export function useExpansionPerformance() {
  const metricsRef = useRef({
    expansionCount: 0,
    averageTime: 0,
    lastExpansionTime: 0,
  });
  
  const measureExpansion = useCallback((callback: () => void) => {
    const start = performance.now();
    callback();
    const end = performance.now();
    
    const duration = end - start;
    metricsRef.current.expansionCount++;
    metricsRef.current.lastExpansionTime = duration;
    metricsRef.current.averageTime = 
      (metricsRef.current.averageTime * (metricsRef.current.expansionCount - 1) + duration) / 
      metricsRef.current.expansionCount;
    
    // Log performance warnings
    if (duration > 16) { // Longer than one frame
      console.warn(`Slow expansion detected: ${duration.toFixed(2)}ms`);
    }
  }, []);
  
  const getMetrics = useCallback(() => ({
    ...metricsRef.current,
    isPerformant: metricsRef.current.averageTime < 16
  }), []);
  
  return { measureExpansion, getMetrics };
}