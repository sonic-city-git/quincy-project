/**
 * 🎯 SUBRENTAL PERIOD CELLS
 * 
 * Creates period-spanning cells for subrental suggestions instead of individual day cells.
 * Shows consolidated periods like "CDM32 subrent need '2'" spanning multiple days.
 */

import { memo, useMemo } from 'react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { Building2, Calendar, Package } from 'lucide-react';
import { SubrentalSuggestion } from '@/types/equipment';
import { LAYOUT } from '../constants';

interface SubrentalPeriod {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
  startDate: string;
  endDate: string;
  daySpan: number;
  leftOffset: number;
  suggestions: SubrentalSuggestion[];
  topProvider?: {
    company_name: string;
    reliability_rating?: number;
  };
}

interface SubrentalPeriodCellsProps {
  suggestions: SubrentalSuggestion[];
  suggestionsByDate: Record<string, SubrentalSuggestion[]>;
  formattedDates: Array<{ dateStr: string; displayName: string }>;
  onSuggestionClick: (suggestion: SubrentalSuggestion, date: string) => void;
}

const SubrentalPeriodCellsComponent = ({
  suggestions,
  suggestionsByDate,
  formattedDates,
  onSuggestionClick
}: SubrentalPeriodCellsProps) => {
  
  // Consolidate suggestions into periods
  const periods = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    
    const equipmentPeriods = new Map<string, SubrentalPeriod>();
    
    // Group suggestions by equipment
    suggestions.forEach(suggestion => {
      const key = suggestion.equipmentId;
      
      if (!equipmentPeriods.has(key)) {
        equipmentPeriods.set(key, {
          equipmentId: suggestion.equipmentId,
          equipmentName: suggestion.equipmentName,
          quantity: suggestion.overbooked,
          startDate: suggestion.date,
          endDate: suggestion.date,
          daySpan: 1,
          leftOffset: 0,
          suggestions: [suggestion],
          topProvider: suggestion.suggestedProviders[0]
        });
      } else {
        const period = equipmentPeriods.get(key)!;
        period.suggestions.push(suggestion);
        period.quantity = Math.max(period.quantity, suggestion.overbooked);
        
        // Extend the period if this date is adjacent
        const currentDate = parseISO(suggestion.date);
        const periodStart = parseISO(period.startDate);
        const periodEnd = parseISO(period.endDate);
        
        if (currentDate < periodStart) {
          period.startDate = suggestion.date;
        }
        if (currentDate > periodEnd) {
          period.endDate = suggestion.date;
        }
      }
    });
    
    // Calculate positions and spans
    const periodsArray = Array.from(equipmentPeriods.values()).map(period => {
      const startDateIndex = formattedDates.findIndex(d => d.dateStr === period.startDate);
      const endDateIndex = formattedDates.findIndex(d => d.dateStr === period.endDate);
      
      if (startDateIndex === -1) return null;
      
      const actualEndIndex = endDateIndex === -1 ? startDateIndex : endDateIndex;
      const daySpan = actualEndIndex - startDateIndex + 1;
      const leftOffset = startDateIndex * LAYOUT.DAY_CELL_WIDTH;
      
      return {
        ...period,
        daySpan,
        leftOffset
      };
    }).filter(Boolean) as SubrentalPeriod[];
    
    return periodsArray;
  }, [suggestions, formattedDates]);
  
  if (periods.length === 0) return null;
  
  return (
    <div className="relative h-16 min-h-16">
      {periods.map((period) => (
        <div
          key={period.equipmentId}
          className="absolute top-1 bottom-1 bg-blue-500 hover:bg-blue-600 rounded-lg border border-blue-400 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md group"
          style={{
            left: `${period.leftOffset}px`,
            width: `${period.daySpan * LAYOUT.DAY_CELL_WIDTH - 4}px`, // -4px for gap between cells
            minWidth: `${Math.max(period.daySpan * LAYOUT.DAY_CELL_WIDTH - 4, 120)}px` // Minimum width for readability
          }}
          onClick={() => {
            // Click the first suggestion for this equipment
            const firstSuggestion = period.suggestions[0];
            if (firstSuggestion) {
              onSuggestionClick(firstSuggestion, period.startDate);
            }
          }}
        >
          {/* Period Content */}
          <div className="h-full px-2 py-1 flex flex-col justify-center text-white text-xs">
            {/* Equipment Name & Quantity */}
            <div className="flex items-center gap-1 font-medium truncate">
              <Package size={12} className="flex-shrink-0" />
              <span className="truncate">
                {period.equipmentName} subrent need "{period.quantity}"
              </span>
            </div>
            
            {/* Provider & Duration */}
            <div className="flex items-center justify-between mt-0.5 text-blue-100">
              <div className="flex items-center gap-1 truncate flex-1">
                <Building2 size={10} className="flex-shrink-0" />
                <span className="truncate text-xs">
                  {period.topProvider?.company_name || 'Multiple providers'}
                </span>
                {period.topProvider?.reliability_rating && (
                  <span className="text-blue-200 text-xs">
                    ★{period.topProvider.reliability_rating.toFixed(1)}
                  </span>
                )}
              </div>
              
              {period.daySpan > 1 && (
                <div className="flex items-center gap-1 text-blue-200 text-xs ml-2">
                  <Calendar size={10} />
                  <span>{period.daySpan}d</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-20 rounded-lg transition-opacity duration-200" />
        </div>
      ))}
    </div>
  );
};

export const SubrentalPeriodCells = memo(SubrentalPeriodCellsComponent);
