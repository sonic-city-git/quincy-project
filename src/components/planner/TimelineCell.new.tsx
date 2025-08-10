/**
 * TIMELINE CELL - ONE ENGINE VERSION
 * 
 * Shows how timeline components use the ONE ENGINE directly.
 * No intermediary calculations, no booking state management.
 */

import React from 'react';
import { useTimelineStock } from '@/hooks/useEquipmentStockEngine';
import { cn } from '@/lib/utils';

interface TimelineCellProps {
  equipmentId: string;
  date: string;
  equipmentName: string;
}

export function TimelineCell({ equipmentId, date, equipmentName }: TimelineCellProps) {
  
  // ONE ENGINE - Direct access to stock data
  const {
    getStock,
    isOverbooked,
    getAvailability
  } = useTimelineStock([equipmentId], [date]);

  // DIRECT DATA - No complex state management
  const stock = getStock(equipmentId, date);
  const overbooked = isOverbooked(equipmentId, date);
  const available = getAvailability(equipmentId, date);

  if (!stock) {
    return (
      <div className="h-12 border border-gray-200 bg-gray-50 flex items-center justify-center">
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // SIMPLE VISUAL LOGIC - Based on virtual stock
  const getCellStyle = () => {
    if (overbooked) return 'bg-red-100 border-red-300 text-red-700';
    if (available === 0) return 'bg-yellow-100 border-yellow-300 text-yellow-700';
    if (stock.virtualAdditions > 0) return 'bg-blue-100 border-blue-300 text-blue-700'; // Has subrentals
    return 'bg-green-100 border-green-300 text-green-700';
  };

  const getStatusText = () => {
    if (overbooked) return `Overbooked -${stock.deficit}`;
    if (available === 0) return 'Fully booked';
    if (stock.virtualAdditions > 0) return `Available (+${stock.virtualAdditions} subrental)`;
    return `Available ${available}`;
  };

  return (
    <div 
      className={cn(
        "h-12 border flex flex-col justify-center px-2 text-xs",
        getCellStyle()
      )}
      title={`${equipmentName} on ${date}\nBase Stock: ${stock.baseStock}\nUsed: ${stock.totalUsed}\nVirtual Additions: ${stock.virtualAdditions}\nEffective Stock: ${stock.effectiveStock}\nAvailable: ${available}`}
    >
      <div className="font-medium">{stock.totalUsed}/{stock.effectiveStock}</div>
      <div className="text-xs opacity-75">{getStatusText()}</div>
    </div>
  );
}
