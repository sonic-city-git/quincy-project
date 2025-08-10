import { memo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { VISUAL, LAYOUT } from '../constants';
import { EquipmentBookingFlat } from '../types';
import { formatPlannerTooltip } from '../../../../utils/tooltipFormatters';

// Crew color logic
const getCrewColor = (booking: any) => {
  const { HEATMAP } = VISUAL;
  const assignments = booking?.bookings || [];
  
  if (assignments.length === 0) {
    // Available crew member - subtle grey
    return {
      backgroundColor: HEATMAP.COLORS.AVAILABLE_BASE,
      color: HEATMAP.TEXT_COLORS.LIGHT_GREY
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
};

// Equipment color logic - SIMPLE
const getEquipmentColor = (booking: any, equipment: any) => {
  const { HEATMAP } = VISUAL;
  const available = booking?.available ?? (equipment.stock || 0);
  const baseStock = booking?.stock ?? equipment.stock ?? 0;
  
  // SIMPLE: Red if negative
  if (available < 0) {
    return {
      backgroundColor: HEATMAP.COLORS.OVERBOOKED_BASE, // Red
      color: HEATMAP.TEXT_COLORS.WHITE
    };
  }
  
  // Orange ONLY if we have base stock but available = 0 (all stock used up)
  if (available === 0 && baseStock > 0) {
    return {
      backgroundColor: '#F97316', // Orange
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
  

  
  // Crew assignments data available for rendering
  
  // Calculate styling based on crew vs equipment
  const heatmapStyle = isCrew ? getCrewColor(booking) : getEquipmentColor(booking, equipment);
  
  // Get display values based on crew vs equipment - ✅ USE ENGINE DATA
  const displayValue = isCrew 
    ? (booking?.bookings?.length > 0 ? booking.bookings.length : '') 
    : (booking?.available !== undefined ? booking.available : equipment.stock || 0);
    
  const isConflict = isCrew 
    ? (booking?.bookings?.length > 1) 
    : (booking?.isOverbooked || false); // ✅ USE ENGINE isOverbooked calculation
  
  // Generate simple tooltip
  const tooltipText = formatPlannerTooltip({
    date: dateInfo.dateStr,
    // Crew-specific data
    ...(isCrew && {
      assignments: booking?.bookings?.map((assignment: any) => ({
        eventName: assignment.eventName,
        projectName: assignment.projectName,
        role: assignment.role,
        location: assignment.location
      })) || [],
      isAvailable: !booking?.bookings || booking.bookings.length === 0,
      isConflict: isConflict
    }),
    // Equipment-specific data
    ...(!isCrew && {
      stock: booking?.stock || equipment.stock || 0,
      used: booking?.totalUsed || 0,
      available: displayValue,
      skipFolderName: true
    })
  });
  
  // Equipment cells are for display and future functionality, not date selection

  return (
    <div 
      className="equipment-day-cell px-1 relative flex items-center justify-center"
      style={{ width: LAYOUT.DAY_CELL_WIDTH }}
    >
      {/* Main availability cell - clickable for expansion */}
      <div
        className={`h-6 w-full transition-all duration-200 relative rounded-md cursor-pointer ${
          dateInfo.isToday 
            ? 'border-2 border-blue-500 hover:border-blue-600' 
            : dateInfo.isSelected
            ? 'border-2 border-blue-300 hover:border-blue-400'
            : 'border border-gray-200/50 hover:border-gray-300'
        }`}
        title={tooltipText}
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
              // Crew: no numbers, just color coding by event type
              ''
            ) : (
              // Equipment: show available stock
              displayValue
            )}
          </span>
          

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