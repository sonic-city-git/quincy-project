/**
 * 🎯 CONFIRMED SUBRENTAL CELLS
 * 
 * Displays confirmed subrental periods in the timeline.
 * Shows actual booked subrentals with provider info and status.
 */

import { memo, useMemo } from 'react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { Building2, Calendar, Package, CheckCircle, Truck, RotateCcw } from 'lucide-react';
import { LAYOUT } from '../constants';

interface ConfirmedSubrentalPeriod {
  id: string;
  equipment_id: string;
  equipment_name: string;
  provider_name: string;
  start_date: string;
  end_date: string;
  quantity: number;
  cost: number | null;
  temporary_serial?: string;
  status: string;
}

interface ConsolidatedPeriod {
  id: string;
  equipment_name: string;
  provider_name: string;
  quantity: number;
  startDate: string;
  endDate: string;
  daySpan: number;
  leftOffset: number;
  status: string;
  cost: number | null;
  temporary_serial?: string;
}

interface ConfirmedSubrentalCellsProps {
  confirmedPeriods: ConfirmedSubrentalPeriod[];
  formattedDates: Array<{ dateStr: string; displayName: string }>;
  onSubrentalClick?: (period: ConfirmedSubrentalPeriod) => void;
}

const ConfirmedSubrentalCellsComponent = ({
  confirmedPeriods,
  formattedDates,
  onSubrentalClick
}: ConfirmedSubrentalCellsProps) => {

  // Consolidate periods for timeline display
  const consolidatedPeriods = useMemo(() => {
    if (!confirmedPeriods || confirmedPeriods.length === 0) return [];

    const periods: ConsolidatedPeriod[] = confirmedPeriods.map(period => {
      const startDateIndex = formattedDates.findIndex(d => d.dateStr === period.start_date);
      const endDateIndex = formattedDates.findIndex(d => d.dateStr === period.end_date);
      
      if (startDateIndex === -1) return null;
      
      const actualEndIndex = endDateIndex === -1 ? startDateIndex : endDateIndex;
      const daySpan = actualEndIndex - startDateIndex + 1;
      const leftOffset = startDateIndex * LAYOUT.DAY_CELL_WIDTH;
      
      return {
        id: period.id,
        equipment_name: period.equipment_name,
        provider_name: period.provider_name,
        quantity: period.quantity,
        startDate: period.start_date,
        endDate: period.end_date,
        daySpan,
        leftOffset,
        status: period.status,
        cost: period.cost,
        temporary_serial: period.temporary_serial
      };
    }).filter(Boolean) as ConsolidatedPeriod[];

    return periods;
  }, [confirmedPeriods, formattedDates]);

  if (consolidatedPeriods.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={12} />;
      case 'delivered':
        return <Truck size={12} />;
      case 'returned':
        return <RotateCcw size={12} />;
      default:
        return <Package size={12} />;
    }
  };

  // Simplified: All confirmed subrentals are blue
  const getStatusColor = () => {
    return 'bg-blue-500 hover:bg-blue-600 border-blue-400';
  };

  return (
    <div className="relative w-full" style={{ height: LAYOUT.EQUIPMENT_ROW_HEIGHT }}>
      {consolidatedPeriods.map((period, index) => (
        <div
          key={`confirmed-${period.id}-${period.leftOffset}-${period.daySpan}-${index}`}
          className={`absolute top-1 bottom-1 rounded-lg border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md group ${getStatusColor()}`}
          style={{
            left: `${period.leftOffset}px`,
            width: `${period.daySpan * LAYOUT.DAY_CELL_WIDTH - 4}px`, // -4px for gap between cells
            minWidth: `${Math.max(period.daySpan * LAYOUT.DAY_CELL_WIDTH - 4, 120)}px` // Minimum width for readability
          }}
          onClick={() => {
            if (onSubrentalClick) {
              // Find the original period data to pass back
              const originalPeriod = confirmedPeriods.find(p => p.id === period.id);
              if (originalPeriod) {
                onSubrentalClick(originalPeriod);
              }
            }
          }}
        >
          {/* Period Content */}
          <div className="h-full px-2 py-1 flex flex-col justify-center text-white text-xs">
            {/* Equipment Name & Quantity */}
            <div className="flex items-center gap-1 font-medium truncate">
              {getStatusIcon(period.status)}
              <span className="truncate">
                {period.equipment_name} x{period.quantity}
              </span>
            </div>
            
            {/* Provider & Details */}
            <div className="flex items-center justify-between mt-0.5 text-white/90">
              <div className="flex items-center gap-1 truncate flex-1">
                <Building2 size={10} className="flex-shrink-0" />
                <span className="truncate text-xs">
                  {period.provider_name}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-white/80 text-xs ml-2">
                {period.cost && (
                  <span>${period.cost.toFixed(0)}</span>
                )}
                {period.daySpan > 1 && (
                  <div className="flex items-center gap-1">
                    <Calendar size={10} />
                    <span>{period.daySpan}d</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-200" />
        </div>
      ))}
    </div>
  );
};

export const ConfirmedSubrentalCells = memo(ConfirmedSubrentalCellsComponent);
