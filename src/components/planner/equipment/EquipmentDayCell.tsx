import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { VISUAL } from '../constants';

// Simplified heatmap color calculation (no green shading)
const getHeatmapColor = (available: number, stock: number, totalUsed: number) => {
  const { HEATMAP } = VISUAL;
  
  // If overbooked (negative available), use red scale - check this FIRST even if stock is 0
  if (available < 0) {
    // Use base red color for overbooked, regardless of stock amount
    return {
      backgroundColor: HEATMAP.COLORS.OVERBOOKED_BASE,
      color: HEATMAP.TEXT_COLORS.WHITE
    };
  }
  
  // Handle edge case: no stock (but not overbooked)
  if (stock === 0) {
    return {
      backgroundColor: HEATMAP.COLORS.NORMAL_DARK_GREY,
      color: HEATMAP.TEXT_COLORS.LIGHT_GREY
    };
  }
  
  // Calculate utilization percentage (how much is used)
  const utilizationRatio = totalUsed / stock;
  
  // Simplified color scheme based on utilization percentage
  if (utilizationRatio < 0.75) {
    // 0-74% utilized - dark grey (normal usage)
    return {
      backgroundColor: HEATMAP.COLORS.NORMAL_DARK_GREY,
      color: HEATMAP.TEXT_COLORS.LIGHT_GREY
    };
  } else {
    // 75-100% utilized - orange warning (getting low or empty)
    return {
      backgroundColor: HEATMAP.COLORS.WARNING_ORANGE,
      color: HEATMAP.TEXT_COLORS.WHITE
    };
  }
};

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
  
  // Calculate availability
  const stock = equipment.stock || 0;
  const totalUsed = booking?.total_used || 0;
  const available = stock - totalUsed;
  
  // Get heatmap styling - always use heatmap colors, never gray/white
  const heatmapStyle = getHeatmapColor(available, stock, totalUsed);
  
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
      }`}
      style={{ width: '50px' }}
    >
      {dateInfo.isSelected && (
        <div className="absolute inset-0 bg-blue-50/50 rounded pointer-events-none" />
      )}
      
      <div
        className="h-6 cursor-pointer transition-all duration-200 relative rounded-md border border-gray-200/50"
        onClick={handleClick}
        title={booking ? 
          `${equipment.name}\nStock: ${stock}\nUsed: ${totalUsed}\nAvailable: ${available}${available < 0 ? ' (OVERBOOKED)' : ''}` : 
          `${equipment.name}\nStock: ${stock}\nAvailable: ${stock}`
        }
        style={heatmapStyle}
      >
        {/* Show loading state if actively updating */}
        {bookingState.isLoading ? (
          <div className="h-full w-full rounded-md bg-blue-200 animate-pulse flex items-center justify-center">
            <div className="text-xs font-medium text-blue-800">...</div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center relative">
            {/* Available count */}
            <span className="text-xs font-medium leading-none">
              {available}
            </span>
            
            {/* Overbooked indicator */}
            {available < 0 && (
              <AlertTriangle className="absolute top-0 right-0 h-2 w-2 text-white opacity-80" />
            )}
          </div>
        )}
        
        {/* Error indicator */}
        {bookingState.error && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
        )}
      </div>
    </div>
  );
};

// Optimized memoization - functions are now stable, so only check data changes
export const EquipmentDayCell = memo(EquipmentDayCellComponent, (prevProps, nextProps) => {
  // Quick checks first for performance
  if (
    prevProps.equipment.id !== nextProps.equipment.id ||
    prevProps.dateInfo.dateStr !== nextProps.dateInfo.dateStr ||
    prevProps.dateInfo.isSelected !== nextProps.dateInfo.isSelected
  ) {
    return false; // Props changed, need to re-render
  }
  
  // Now check booking state changes
  const prevState = prevProps.getBookingState(prevProps.equipment.id, prevProps.dateInfo.dateStr);
  const nextState = nextProps.getBookingState(nextProps.equipment.id, nextProps.dateInfo.dateStr);
  
  // Check if booking data actually changed
  const prevBooking = prevState.data || prevProps.getBookingsForEquipment(prevProps.equipment.id, prevProps.dateInfo.dateStr, prevProps.equipment);
  const nextBooking = nextState.data || nextProps.getBookingsForEquipment(nextProps.equipment.id, nextProps.dateInfo.dateStr, nextProps.equipment);
  
  return (
    prevState.isLoading === nextState.isLoading &&
    prevState.error === nextState.error &&
    prevBooking?.total_used === nextBooking?.total_used && // Only re-render if the actual usage changed
    prevBooking?.is_overbooked === nextBooking?.is_overbooked
  );
});

EquipmentDayCell.displayName = 'EquipmentDayCell';