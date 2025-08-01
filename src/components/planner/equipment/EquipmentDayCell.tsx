import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { VISUAL } from '../constants';

interface EquipmentDayCellProps {
  equipment: any;
  dateInfo: {
    date: Date;
    dateStr: string;
    isSelected: boolean;
    isWeekendDay: boolean;
  };
  getBookingsForEquipment: (equipmentId: string, dateStr: string, equipment: any) => any;
  getBookingState: (equipmentId: string, dateStr: string) => any;
  updateBookingState: (equipmentId: string, dateStr: string, state: any) => void;
  onDateChange: (date: Date) => void;
}

const EquipmentDayCellComponent = ({ 
  equipment, 
  dateInfo, 
  getBookingsForEquipment,
  getBookingState,
  updateBookingState,
  onDateChange
}: EquipmentDayCellProps) => {
  const bookingState = getBookingState(equipment.id, dateInfo.dateStr);
  
  // Use optimistic data if available, otherwise fallback to main data
  const booking = bookingState.data || getBookingsForEquipment(equipment.id, dateInfo.dateStr, equipment);
  
  // Handle click with optimistic update
  const handleClick = () => {
    onDateChange(dateInfo.date);
    
    // Could add optimistic booking updates here in the future
    // For now, just handle the date change optimistically
  };

  return (
    <div 
      className={`px-1 relative ${
        dateInfo.isSelected ? 'z-10' : ''
      } ${dateInfo.isWeekendDay ? 'bg-gradient-to-b from-orange-50 to-orange-100 opacity-60' : ''}`}
      style={{ width: '50px' }}
    >
      {dateInfo.isSelected && (
        <div className="absolute inset-0 bg-blue-50/50 rounded pointer-events-none" />
      )}
      
      <div
        className="h-6 cursor-pointer transition-all duration-200 relative"
        onClick={handleClick}
        title={booking ? 
          `${equipment.name} - ${booking.total_used}/${equipment.stock} used${booking.is_overbooked ? ' (OVERBOOKED)' : ''}` : 
          `${equipment.name} - Available`
        }
      >
        {/* Show loading state if actively updating */}
        {bookingState.isLoading ? (
          <div className="h-full w-full rounded-md bg-blue-200 animate-pulse" />
        ) : booking ? (
          <div 
            className={`h-full w-full rounded-md shadow-sm ${
              booking.is_overbooked 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
            style={{ 
              opacity: Math.min(booking.total_used / equipment.stock, 1) * VISUAL.BOOKING_OPACITY_RANGE + VISUAL.MIN_BOOKING_OPACITY
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
        
        {/* Error indicator */}
        {bookingState.error && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
        )}
      </div>
    </div>
  );
};

// Memoize for performance - only re-render if booking data or loading state changes
export const EquipmentDayCell = memo(EquipmentDayCellComponent, (prevProps, nextProps) => {
  const prevState = prevProps.getBookingState(prevProps.equipment.id, prevProps.dateInfo.dateStr);
  const nextState = nextProps.getBookingState(nextProps.equipment.id, nextProps.dateInfo.dateStr);
  
  return (
    prevProps.equipment.id === nextProps.equipment.id &&
    prevProps.dateInfo.dateStr === nextProps.dateInfo.dateStr &&
    prevProps.dateInfo.isSelected === nextProps.dateInfo.isSelected &&
    prevState.isLoading === nextState.isLoading &&
    prevState.data === nextState.data &&
    prevState.error === nextState.error
  );
});

EquipmentDayCell.displayName = 'EquipmentDayCell';