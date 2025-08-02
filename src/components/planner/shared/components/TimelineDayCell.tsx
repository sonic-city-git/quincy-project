import { memo } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { VISUAL, LAYOUT } from '../constants';
import { EquipmentBookingFlat } from '../types';

// Crew availability color calculation (binary + event type colors)
const getCrewAvailabilityColor = (booking: any, isCrew: boolean = false) => {
  const { HEATMAP } = VISUAL;
  
  // Use explicit isCrew flag only - no automatic detection
  const isCrewData = isCrew;
  
  if (isCrewData) {
    // Crew-specific display logic
    const assignments = booking?.bookings || [];
    
    if (assignments.length === 0) {
      // Available crew member - subtle grey
      return {
        backgroundColor: HEATMAP.COLORS.AVAILABLE_BASE,
        color: HEATMAP.TEXT_COLORS.LIGHT_GREY // light text on dark background
      };
    }
    
    if (assignments.length > 1) {
      // Conflict - crew member assigned to multiple events
      return {
        backgroundColor: HEATMAP.COLORS.OVERBOOKED_BASE,
        color: HEATMAP.TEXT_COLORS.WHITE
      };
    }
    
    // Single assignment - use event type color
    const assignment = assignments[0];
    const eventTypeColor = assignment.eventTypeColor || '#6B7280';
    
    return {
      backgroundColor: eventTypeColor,
      color: HEATMAP.TEXT_COLORS.WHITE
    };
  }
  
  // Equipment-specific display logic
  const stock = booking?.stock || 0;
  const totalUsed = booking?.totalUsed || 0;
  const available = stock - totalUsed; // Always calculate properly, even when stock is 0
  
  // CRITICAL: Check overbooked first, regardless of stock level
  // This handles cases where stock is 0 but totalUsed > 0
  if (available < 0) {
    console.log('🔴 Equipment overbooked - applying red color:', {
      stock,
      totalUsed,
      available,
      booking
    });
    return {
      backgroundColor: HEATMAP.COLORS.OVERBOOKED_BASE,
      color: HEATMAP.TEXT_COLORS.WHITE
    };
  }
  
  // Handle edge case: no stock and no usage
  if (stock === 0 && totalUsed === 0) {
    return {
      backgroundColor: HEATMAP.COLORS.NORMAL_DARK_GREY,
      color: HEATMAP.TEXT_COLORS.LIGHT_GREY
    };
  }
  
  // If empty (all stock used but not overbooked), use orange
  if (stock > 0 && totalUsed === stock) {
    return {
      backgroundColor: HEATMAP.COLORS.WARNING_ORANGE,
      color: HEATMAP.TEXT_COLORS.WHITE
    };
  }
  
  // Normal usage (some availability remaining) - dark grey
  return {
    backgroundColor: HEATMAP.COLORS.NORMAL_DARK_GREY,
    color: HEATMAP.TEXT_COLORS.LIGHT_GREY
  };
};

interface TimelineDayCellProps {
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
  isCrew?: boolean; // Flag to indicate this is crew data vs equipment
}

const TimelineDayCellComponent = ({ 
  equipment, 
  dateInfo, 
  getBookingForEquipment,
  isExpanded,
  onToggleExpansion,
  isFirstCell = false,
  isCrew = false
}: TimelineDayCellProps) => {
  // Use optimized function instead of direct Map access
  const booking = getBookingForEquipment(equipment.id, dateInfo.dateStr);
  
  // Debug crew assignments reaching timeline cells
  if (isCrew && booking?.bookings?.length > 0) {
    console.log('🎨 Crew assignment in timeline cell:', {
      crewMember: equipment.name,
      date: dateInfo.dateStr,
      assignments: booking.bookings.length,
      firstAssignment: booking.bookings[0],
      eventType: booking.bookings[0]?.eventType,
      eventColor: booking.bookings[0]?.eventTypeColor
    });
  }
  
  // Calculate styling based on crew vs equipment
  const heatmapStyle = getCrewAvailabilityColor(booking, isCrew);
  
  // Get display values based on crew vs equipment
  const displayValue = isCrew 
    ? (booking?.bookings?.length > 0 ? booking.bookings.length : '') 
    : (booking ? booking.stock - booking.totalUsed : equipment.stock || 0);
    
  const isConflict = isCrew 
    ? (booking?.bookings?.length > 1) 
    : (booking ? booking.stock - booking.totalUsed < 0 : false);
  
  // Equipment cells are for display and future functionality, not date selection

  return (
    <div 
      className={`equipment-day-cell px-1 relative ${
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
                  title={isCrew ? 
            `${equipment.name}\n${booking?.bookings?.length > 0 ? 
              `Assigned to: ${booking.bookings.map(b => b.eventName).join(', ')}` : 
              'Available'
            }${isConflict ? '\n⚠️ CONFLICT: Multiple assignments!' : ''}` :
            `${booking ? 
              `${equipment.name}\nStock: ${booking.stock}\nUsed: ${booking.totalUsed}\nAvailable: ${displayValue}${displayValue < 0 ? ' (OVERBOOKED)' : ''}` : 
              `${equipment.name}\nStock: ${equipment.stock || 0}\nAvailable: ${equipment.stock || 0}`
            }`
          }
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
              title={isExpanded ? 
                `Collapse ${isCrew ? 'assignment' : 'project'} breakdown` : 
                `Expand to see ${isCrew ? 'assignment' : 'project'} breakdown`
              }
            >
              {isExpanded ? 
                <ChevronDown className="h-2 w-2 text-white" /> : 
                <ChevronRight className="h-2 w-2 text-white" />
              }
            </div>
          )}
          
          {/* Display content based on crew vs equipment */}
          <span className="text-xs font-medium leading-none">
            {isCrew ? (
              // Crew: show assignment count or nothing if available
              booking?.bookings?.length > 0 ? booking.bookings.length : ''
            ) : (
              // Equipment: show available stock
              displayValue
            )}
          </span>
          
          {/* Conflict/Overbooked indicator */}
          {isConflict && (
            <AlertTriangle className="absolute top-0 right-0 h-2 w-2 text-white opacity-80" />
          )}
        </div>
      </div>
    </div>
  );
};

// Memoized component with explicit comparison for booking function updates
export const TimelineDayCell = memo(TimelineDayCellComponent, (prevProps, nextProps) => {
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

TimelineDayCell.displayName = 'TimelineDayCell';