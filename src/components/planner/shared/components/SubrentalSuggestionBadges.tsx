/**
 * 🎯 SUBRENTAL SUGGESTION BADGES
 * 
 * Displays subrental suggestions in the timeline, similar to UnfilledRoleBadges
 * but focused on equipment overbooking solutions.
 */

import { memo } from 'react';
import { ExternalLink, Plus, Building2 } from 'lucide-react';
import { SubrentalSuggestion } from '@/types/equipment';

interface SubrentalSuggestionBadgesProps {
  suggestions: SubrentalSuggestion[];
  dateStr: string;
  onSuggestionClick: (suggestion: SubrentalSuggestion, date: string) => void;
}

const SubrentalSuggestionBadgesComponent = ({
  suggestions,
  dateStr,
  onSuggestionClick
}: SubrentalSuggestionBadgesProps) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1 p-1">
      {suggestions.map((suggestion) => {
        const topProvider = suggestion.suggestedProviders[0];
        const hasMultipleProviders = suggestion.suggestedProviders.length > 1;
        
        return (
          <div
            key={`${suggestion.equipmentId}-${dateStr}`}
            className="group bg-blue-50 border border-blue-200 rounded-md px-2 py-1.5 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-colors"
            onClick={() => onSuggestionClick(suggestion, dateStr)}
          >
            {/* Equipment Name & Overbooking Info */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-blue-900 text-xs truncate">
                {suggestion.equipmentName}
              </span>
              <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded">
                -{suggestion.overbooked}
              </span>
            </div>
            
            {/* Provider Suggestion */}
            {topProvider && (
              <div className="flex items-center gap-1 text-blue-700">
                <Building2 size={10} />
                <span className="text-xs truncate">
                  {topProvider.company_name}
                </span>
                {topProvider.reliability_rating && (
                  <span className="text-xs text-blue-600">
                    ★{topProvider.reliability_rating.toFixed(1)}
                  </span>
                )}
              </div>
            )}
            
            {/* Additional Info */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1 text-blue-600 text-xs">
                <Plus size={10} />
                <span>Add subrental</span>
              </div>
              
              {hasMultipleProviders && (
                <div className="flex items-center gap-1 text-blue-500 text-xs">
                  <ExternalLink size={10} />
                  <span>+{suggestion.suggestedProviders.length - 1} more</span>
                </div>
              )}
            </div>
            
            {/* Affected Events Count */}
            {suggestion.affectedEvents.length > 1 && (
              <div className="text-xs text-blue-600 mt-1">
                Affects {suggestion.affectedEvents.length} events
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const SubrentalSuggestionBadges = memo(SubrentalSuggestionBadgesComponent);
