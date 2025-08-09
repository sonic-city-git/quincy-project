/**
 * 🎯 SUBRENTAL SUGGESTIONS - UNIFIED STOCK ENGINE VERSION
 * 
 * ✅ COMPLETELY REDESIGNED FOR UNIFIED STOCK ENGINE
 * 
 * Detects equipment overbookings and provides intelligent subrental suggestions
 * using the new unified stock engine with virtual stock calculations.
 * 
 * Benefits:
 * - Real-time conflict detection with virtual stock
 * - Built-in subrental suggestion engine
 * - Optimized batch calculations
 * - Geographic and provider matching
 * - Conflict severity analysis
 */

import { useMemo } from 'react';
import { useStockEngine } from '@/hooks/stock/useStockEngine';
import { getWarningTimeframe } from '@/constants/timeframes';

interface UseSubrentalSuggestionsProps {
  resourceType: 'equipment' | 'crew';
  visibleTimelineStart?: Date;
  visibleTimelineEnd?: Date;
  selectedOwner?: string;
  equipmentIds?: string[];
}

interface SubrentalSuggestion {
  equipmentId: string;
  equipmentName: string;
  date: string;
  overbooked: number;
  affectedEvents: Array<{
    eventName: string;
    projectName: string;
    quantity: number;
  }>;
  suggestedProviders: Array<{
    id: string;
    name: string;
    contact_info: any;
    geographic_coverage: string[];
    reliability_rating: number;
    preferred_status: boolean;
  }>;
}

export function useSubrentalSuggestions({
  resourceType,
  visibleTimelineStart,
  visibleTimelineEnd,
  selectedOwner,
  equipmentIds
}: UseSubrentalSuggestionsProps) {
  
  // Use custom date range if provided, otherwise use standard timeframe
  const { startDate: defaultStart, endDate: defaultEnd } = getWarningTimeframe();
  const startDate = visibleTimelineStart?.toISOString().split('T')[0] || defaultStart;
  const endDate = visibleTimelineEnd?.toISOString().split('T')[0] || defaultEnd;

  // Get conflicts and suggestions from unified stock engine
  const stockEngine = useStockEngine({
    dateRange: {
      start: new Date(startDate),
      end: new Date(endDate)
    },
    equipmentIds,
    includeVirtualStock: true,
    includeConflictAnalysis: true,
    includeSuggestions: true,
    cacheResults: true,
    batchSize: 100
  });

  // Check if date is within visible timeline
  const isDateVisible = (dateStr: string): boolean => {
    if (!visibleTimelineStart || !visibleTimelineEnd) return true;
    
    const date = new Date(dateStr);
    return date >= visibleTimelineStart && date <= visibleTimelineEnd;
  };

  // Transform stock engine suggestions to legacy format
  const subrentalSuggestions = useMemo((): SubrentalSuggestion[] => {
    if (resourceType !== 'equipment' || stockEngine.isLoading) return [];
    
    return stockEngine.suggestions
      .filter(suggestion => isDateVisible(suggestion.date))
      .map(suggestion => ({
        equipmentId: suggestion.equipmentId,
        equipmentName: suggestion.equipmentName,
        date: suggestion.date,
        overbooked: suggestion.requiredQuantity,
        affectedEvents: suggestion.conflictingEvents.map(event => ({
          eventName: event.eventName,
          projectName: event.projectName,
          quantity: event.quantity
        })),
        suggestedProviders: suggestion.providers.map(provider => ({
          id: provider.id,
          name: provider.name,
          contact_info: provider.contactInfo,
          geographic_coverage: provider.coverage || [],
          reliability_rating: provider.rating || 0,
          preferred_status: provider.isPreferred || false
        }))
      }));
  }, [stockEngine.suggestions, stockEngine.isLoading, resourceType, visibleTimelineStart, visibleTimelineEnd]);

  // Group suggestions by date for timeline display
  const suggestionsByDate = useMemo(() => {
    const grouped = new Map<string, SubrentalSuggestion[]>();
    
    subrentalSuggestions.forEach(suggestion => {
      const existing = grouped.get(suggestion.date) || [];
      existing.push(suggestion);
      grouped.set(suggestion.date, existing);
    });
    
    return grouped;
  }, [subrentalSuggestions]);

  // Check if we should show the subrental section
  const shouldShowSubrentalSection = subrentalSuggestions.length > 0;

  return {
    subrentalSuggestions,
    suggestionsByDate,
    shouldShowSubrentalSection,
    totalConflicts: subrentalSuggestions.length,
    affectedDates: Array.from(suggestionsByDate.keys()).sort(),
    // New unified stock engine capabilities
    isLoading: stockEngine.isLoading,
    error: stockEngine.error,
    conflicts: stockEngine.conflicts, // Raw conflict data
    virtualStock: stockEngine.virtualStock // Virtual stock breakdown
  };
}