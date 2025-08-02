import { memo } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { VISUAL, LAYOUT } from '../constants';
import { EquipmentBookingFlat } from '../types';

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
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  };
  getBookingForEquipment: (equipmentId: string, dateStr: string) => EquipmentBookingFlat | undefined;
  isExpanded: boolean;
  onToggleExpansion: (equipmentId: string) => void;
  isFirstCell?: boolean; // Used to show expansion indicator on first cell
}

const EquipmentDayCellComponent = ({ 
  equipment, 
  dateInfo, 
  getBookingForEquipment,
  isExpanded,
  onToggleExpansion,
  isFirstCell = false
}: EquipmentDayCellProps) => {
  // Use optimized function instead of direct Map access
  const booking = getBookingForEquipment(equipment.id, dateInfo.dateStr);
  
  // Calculate availability
  const stock = equipment.stock || 0;
  const totalUsed = booking?.totalUsed || 0;
  const available = stock - totalUsed;
  
  // Debug: Track renders and data availability
  if (equipment.name.includes('Camera') && dateInfo.dateStr.includes('2025-08-01')) {
    console.log(`📱 ${equipment.name}: ${available}/${stock} available, booking:`, booking);
    console.log(`📱 Function returned:`, booking ? 'BOOKING DATA' : 'NO BOOKING');
  }
  
  // Get heatmap styling - always use heatmap colors, never gray/white
  const heatmapStyle = getHeatmapColor(available, stock, totalUsed);
  
  // Equipment cells are for display and future functionality, not date selection

  return (
    <div 
      className={`px-1 relative ${
        dateInfo.isSelected || dateInfo.isToday ? 'z-10' : ''
      } flex items-center justify-center`}
      style={{ width: '50px' }}
    >
      {/* Today indicator - solid blue background */}
      {dateInfo.isToday && (
        <div className="absolute inset-0 bg-blue-100/80 rounded pointer-events-none" />
      )}
      {/* Selected indicator - solid border overlay */}
      {dateInfo.isSelected && (
        <div className="absolute inset-0 border-2 border-blue-300 rounded pointer-events-none" />
      )}
      
      {/* Main availability cell - clickable for expansion */}
      <div
        className="h-6 w-full transition-all duration-200 relative rounded-md border border-gray-200/50 cursor-pointer hover:border-gray-300"
        title={`${booking ? 
          `${equipment.name}\nStock: ${stock}\nUsed: ${totalUsed}\nAvailable: ${available}${available < 0 ? ' (OVERBOOKED)' : ''}` : 
          `${equipment.name}\nStock: ${stock}\nAvailable: ${stock}`
        }${dateInfo.isToday ? '\n(Today)' : ''}${dateInfo.isSelected ? '\n(Selected)' : ''}\n\nClick to ${isExpanded ? 'collapse' : 'expand'} project breakdown`}
        style={heatmapStyle}
        onClick={() => {
          onToggleExpansion(equipment.id);
        }}
      >
        <div className="h-full w-full flex items-center justify-center relative">
          {/* Expansion indicator - only show on first cell */}
          {isFirstCell && (
            <div
              className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center z-10"
              title={isExpanded ? 'Collapse project breakdown' : 'Expand to see project breakdown'}
            >
              {isExpanded ? 
                <ChevronDown className="h-2 w-2 text-white" /> : 
                <ChevronRight className="h-2 w-2 text-white" />
              }
            </div>
          )}
          
          {/* Available count */}
          <span className="text-xs font-medium leading-none">
            {available}
          </span>
          
          {/* Overbooked indicator */}
          {available < 0 && (
            <AlertTriangle className="absolute top-0 right-0 h-2 w-2 text-white opacity-80" />
          )}
        </div>
      </div>
    </div>
  );
};

// Memoized component with explicit comparison for booking function updates
export const EquipmentDayCell = memo(EquipmentDayCellComponent, (prevProps, nextProps) => {
  // Re-render if booking function reference changes (this handles data updates)
  if (prevProps.getBookingForEquipment !== nextProps.getBookingForEquipment) {
    return false;
  }
  
  // Re-render if equipment changes
  if (prevProps.equipment.id !== nextProps.equipment.id || prevProps.equipment.stock !== nextProps.equipment.stock) {
    return false;
  }
  
  // Re-render if expansion state changes
  if (prevProps.isExpanded !== nextProps.isExpanded) {
    return false;
  }
  
  // Re-render if expansion toggle function changes
  if (prevProps.onToggleExpansion !== nextProps.onToggleExpansion) {
    return false;
  }
  
  // Re-render if first cell status changes
  if (prevProps.isFirstCell !== nextProps.isFirstCell) {
    return false;
  }
  
  // Re-render if date changes
  if (prevProps.dateInfo.dateStr !== nextProps.dateInfo.dateStr || 
      prevProps.dateInfo.isToday !== nextProps.dateInfo.isToday ||
      prevProps.dateInfo.isSelected !== nextProps.dateInfo.isSelected) {
    return false;
  }
  
  // Otherwise, skip re-render
  return true;
});

EquipmentDayCell.displayName = 'EquipmentDayCell';