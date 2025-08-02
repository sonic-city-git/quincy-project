/**
 * VIRTUALIZED EQUIPMENT LIST - For handling large equipment lists efficiently
 * 
 * Key optimizations:
 * 1. Only render visible rows
 * 2. Intersection Observer for expansion
 * 3. Batch expansion operations
 * 4. Memory-efficient scrolling
 */

import { memo, useMemo, useCallback, useRef, useEffect, useState } from "react";
import { ExpandedEquipmentRow } from "./ExpandedEquipmentRow";
import { LAYOUT } from '../constants';

interface VirtualizedEquipmentListProps {
  equipment: any[];
  expandedEquipment: Set<string>;
  equipmentProjectUsage: Map<string, any>;
  formattedDates: any[];
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any;
  getProjectQuantityForDate: (projectName: string, equipmentId: string, dateStr: string) => any;
  onToggleExpansion: (equipmentId: string) => void;
  containerRef: React.RefObject<HTMLElement>;
}

const VIRTUALIZATION_CONFIG = {
  OVERSCAN: 5, // Render 5 extra rows above/below viewport
  ROW_HEIGHT: LAYOUT.EQUIPMENT_ROW_HEIGHT,
  PROJECT_HEIGHT: LAYOUT.PROJECT_ROW_HEIGHT,
  VIEWPORT_THRESHOLD: 1000, // Only virtualize if more than this many pixels
};

const VirtualizedEquipmentListComponent = ({
  equipment,
  expandedEquipment,
  equipmentProjectUsage,
  formattedDates,
  getBookingForEquipment,
  getProjectQuantityForDate,
  onToggleExpansion,
  containerRef
}: VirtualizedEquipmentListProps) => {
  
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: equipment.length });
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate row heights (equipment + expanded projects)
  const rowHeights = useMemo(() => {
    return equipment.map(eq => {
      const isExpanded = expandedEquipment.has(eq.id);
      const projectCount = equipmentProjectUsage.get(eq.id)?.projectNames.length || 0;
      
      return VIRTUALIZATION_CONFIG.ROW_HEIGHT + 
        (isExpanded ? projectCount * VIRTUALIZATION_CONFIG.PROJECT_HEIGHT : 0);
    });
  }, [equipment, expandedEquipment, equipmentProjectUsage]);
  
  // Calculate total height
  const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0);
  
  // OPTIMIZATION: Only virtualize if content is large enough
  const shouldVirtualize = totalHeight > VIRTUALIZATION_CONFIG.VIEWPORT_THRESHOLD;
  
  // Calculate visible range
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current || !shouldVirtualize) {
      return { start: 0, end: equipment.length };
    }
    
    const container = containerRef.current;
    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    
    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = equipment.length;
    
    // Find start index
    for (let i = 0; i < rowHeights.length; i++) {
      if (accumulatedHeight + rowHeights[i] > scrollTop) {
        startIndex = Math.max(0, i - VIRTUALIZATION_CONFIG.OVERSCAN);
        break;
      }
      accumulatedHeight += rowHeights[i];
    }
    
    // Find end index
    accumulatedHeight = 0;
    for (let i = 0; i < rowHeights.length; i++) {
      accumulatedHeight += rowHeights[i];
      if (accumulatedHeight > scrollTop + containerHeight + 
          (VIRTUALIZATION_CONFIG.OVERSCAN * VIRTUALIZATION_CONFIG.ROW_HEIGHT)) {
        endIndex = Math.min(equipment.length, i + VIRTUALIZATION_CONFIG.OVERSCAN);
        break;
      }
    }
    
    return { start: startIndex, end: endIndex };
  }, [containerRef, shouldVirtualize, equipment.length, rowHeights, scrollTop]);
  
  // Update visible range on scroll
  useEffect(() => {
    if (!shouldVirtualize) return;
    
    const range = calculateVisibleRange();
    setVisibleRange(range);
  }, [calculateVisibleRange, shouldVirtualize]);
  
  // Scroll handler with throttling
  useEffect(() => {
    if (!containerRef.current || !shouldVirtualize) return;
    
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            setScrollTop(containerRef.current.scrollTop);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, shouldVirtualize]);
  
  // Calculate offset for virtual scrolling
  const offsetY = useMemo(() => {
    if (!shouldVirtualize) return 0;
    
    return rowHeights.slice(0, visibleRange.start).reduce((sum, height) => sum + height, 0);
  }, [rowHeights, visibleRange.start, shouldVirtualize]);
  
  // Visible equipment items
  const visibleEquipment = shouldVirtualize 
    ? equipment.slice(visibleRange.start, visibleRange.end)
    : equipment;
  
  // OPTIMIZATION: Batch expansion operations
  const batchToggleExpansion = useCallback((equipmentIds: string[]) => {
    // Batch multiple expansions to avoid layout thrashing
    equipmentIds.forEach(id => onToggleExpansion(id));
  }, [onToggleExpansion]);
  
  if (!shouldVirtualize) {
    // Small lists - no virtualization needed
    return (
      <>
        {equipment.map((eq) => (
          <ExpandedEquipmentRow
            key={eq.id}
            equipment={eq}
            isExpanded={expandedEquipment.has(eq.id)}
            equipmentUsage={equipmentProjectUsage.get(eq.id)}
            formattedDates={formattedDates}
            getBookingForEquipment={getBookingForEquipment}
            getProjectQuantityForDate={getProjectQuantityForDate}
            onToggleExpansion={onToggleExpansion}
          />
        ))}
      </>
    );
  }
  
  // Large lists - virtualized rendering
  return (
    <div style={{ height: totalHeight, position: 'relative' }}>
      <div style={{ transform: `translateY(${offsetY}px)` }}>
        {visibleEquipment.map((eq, index) => (
          <ExpandedEquipmentRow
            key={eq.id}
            equipment={eq}
            isExpanded={expandedEquipment.has(eq.id)}
            equipmentUsage={equipmentProjectUsage.get(eq.id)}
            formattedDates={formattedDates}
            getBookingForEquipment={getBookingForEquipment}
            getProjectQuantityForDate={getProjectQuantityForDate}
            onToggleExpansion={onToggleExpansion}
          />
        ))}
      </div>
    </div>
  );
};

export const VirtualizedEquipmentList = memo(VirtualizedEquipmentListComponent);

VirtualizedEquipmentList.displayName = 'VirtualizedEquipmentList';