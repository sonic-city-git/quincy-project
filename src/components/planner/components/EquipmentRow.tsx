import React, { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { format, isSameDay, isWeekend } from 'date-fns';
import { Equipment } from '../../../types/equipment';

interface EquipmentRowProps {
  equipment: Equipment;
  dates: Date[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  getBookingsForEquipment: (equipmentId: string, date: Date, equipment: Equipment) => any;
  indentLevel?: number;
}


const EquipmentRowComponent = ({ 
  equipment, 
  dates, 
  selectedDate, 
  onDateChange, 
  getBookingsForEquipment,
  indentLevel = 8
}: EquipmentRowProps) => {
  const paddingClass = indentLevel === 8 ? 'pl-8' : indentLevel === 12 ? 'pl-12' : 'pl-16';

  return (
    <div className="flex items-center py-3 hover:bg-muted/30 transition-colors group/item">
      {/* Fixed Equipment Name Column */}
      <div className="w-[260px] flex-shrink-0 px-4">
        <div className={`flex items-center gap-3 ${paddingClass}`}>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground truncate">{equipment.name}</div>
            <div className="text-xs text-muted-foreground">Stock: {equipment.stock}</div>
          </div>
        </div>
      </div>
      
      {/* Date Indicators - NO scroll, positioned within master scroll area */}
      <div 
        className="flex-1 flex pointer-events-none"
        style={{ minWidth: `${dates.length * 50}px` }}
      >
        {dates.map(date => {
          const booking = getBookingsForEquipment(equipment.id, date, equipment);
          const isSelected = isSameDay(date, selectedDate);
          
          return (
            <div 
              key={date.toISOString()} 
              className={`w-[50px] px-1 relative pointer-events-auto ${
                isSelected ? 'z-20' : ''
              }`}
            >
              {/* Selected date highlight */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-50/50 rounded pointer-events-none z-15" />
              )}
              
              <div
                className="h-6 cursor-pointer transition-all duration-200 relative z-20"
                onClick={() => onDateChange(date)}
                title={booking ? 
                  `${equipment.name} - ${booking.total_used}/${equipment.stock} used${booking.is_overbooked ? ' (OVERBOOKED)' : ''}` : 
                  `${equipment.name} - Available`
                }
              >
                {booking ? (
                  <div 
                    className={`h-full w-full rounded-md shadow-sm ${
                      booking.is_overbooked 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                    style={{ 
                      opacity: Math.min(booking.total_used / equipment.stock, 1) * 0.7 + 0.3
                    }}
                  >
                    {booking.is_overbooked && (
                      <div className="flex items-center justify-center h-full">
                        <AlertTriangle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full w-full rounded-md bg-muted hover:bg-muted/70 transition-colors" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Fixed Stock Column */}
      <div className="w-[70px] flex-shrink-0 px-4">
        <div className="text-center">
          <span className="text-sm font-medium text-muted-foreground">
            {equipment.stock}
          </span>
        </div>
      </div>
    </div>
  );
};

// Memoize for performance - only re-render when props actually change
export const EquipmentRow = memo(EquipmentRowComponent, (prevProps, nextProps) => {
  return (
    prevProps.equipment.id === nextProps.equipment.id &&
    prevProps.equipment.name === nextProps.equipment.name &&
    prevProps.equipment.stock === nextProps.equipment.stock &&
    prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime() &&
    prevProps.dates.length === nextProps.dates.length &&
    prevProps.indentLevel === nextProps.indentLevel
  );
});