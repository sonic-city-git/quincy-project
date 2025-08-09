/**
 * 🎯 SUBRENTAL SUGGESTIONS HOOK
 * 
 * Detects equipment overbookings and provides intelligent subrental suggestions
 * with geographic and provider matching logic.
 */

import { useMemo } from 'react';
import { useExternalProviders } from './useExternalProviders';
import { SubrentalSuggestion, ExternalProvider } from '@/types/equipment';

interface UseSubrentalSuggestionsProps {
  warnings: Array<{
    resourceId: string;
    resourceName: string;
    date: string;
    type: string;
    severity: string;
    details: {
      stock: number;
      used: number;
      overbooked: number;
      events: Array<{
        eventName: string;
        projectName: string;
        quantity: number;
        location?: string;
      }>;
    };
  }>;
  resourceType: 'equipment' | 'crew';
  visibleTimelineStart?: Date;
  visibleTimelineEnd?: Date;
}

export function useSubrentalSuggestions({
  warnings,
  resourceType,
  visibleTimelineStart,
  visibleTimelineEnd
}: UseSubrentalSuggestionsProps) {
  const { data: externalProviders = [] } = useExternalProviders();

  // Smart provider matching logic
  const getProviderSuggestions = (
    equipmentName: string, 
    projectLocation?: string
  ): ExternalProvider[] => {
    return externalProviders
      .filter(provider => {
        // Geographic match - check if provider covers the project location
        const locationMatch = !projectLocation || 
          !provider.geographic_coverage ||
          provider.geographic_coverage.some(area => 
            projectLocation.toLowerCase().includes(area.toLowerCase()) ||
            area.toLowerCase().includes(projectLocation.toLowerCase())
          );
        
        // For now, assume all providers can handle all equipment types
        // This could be enhanced with equipment category matching
        const capabilityMatch = true;
        
        return locationMatch && capabilityMatch;
      })
      .sort((a, b) => {
        // Sort by: preferred_status first, then reliability_rating
        if (a.preferred_status !== b.preferred_status) {
          return a.preferred_status ? -1 : 1;
        }
        return (b.reliability_rating || 0) - (a.reliability_rating || 0);
      })
      .slice(0, 3); // Top 3 suggestions
  };

  // Check if date is within visible timeline
  const isDateVisible = (dateStr: string): boolean => {
    if (!visibleTimelineStart || !visibleTimelineEnd) return true;
    
    const date = new Date(dateStr);
    return date >= visibleTimelineStart && date <= visibleTimelineEnd;
  };

  // Generate subrental suggestions from warnings
  const subrentalSuggestions = useMemo((): SubrentalSuggestion[] => {
    if (resourceType !== 'equipment') return [];
    
    const suggestions: SubrentalSuggestion[] = [];
    
    warnings.forEach(warning => {
      if (warning.type === 'overbooked') {
        const { stock, used, overbooked, events } = warning.details;
        
        // Only suggest subrental if:
        // 1. Actually overbooked (not just fully booked)
        // 2. Multiple projects involved OR significant overbooking
        // 3. Within visible timeline (user is looking at this period)
        
        const isActuallyOverbooked = overbooked > 0;
        const hasConflicts = events.length > 1 || overbooked >= 2;
        const isVisible = isDateVisible(warning.date);
        
        if (isActuallyOverbooked && hasConflicts && isVisible) {
          // Get project location from first event (could be enhanced to check all)
          const primaryLocation = events[0]?.location;
          
          suggestions.push({
            equipmentId: warning.resourceId,
            equipmentName: warning.resourceName,
            date: warning.date,
            overbooked,
            affectedEvents: events.map(event => ({
              eventName: event.eventName,
              projectName: event.projectName,
              quantity: event.quantity
            })),
            suggestedProviders: getProviderSuggestions(warning.resourceName, primaryLocation)
          });
        }
      }
    });
    
    return suggestions;
  }, [warnings, resourceType, externalProviders, visibleTimelineStart, visibleTimelineEnd]);

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
    affectedDates: Array.from(suggestionsByDate.keys()).sort()
  };
}
