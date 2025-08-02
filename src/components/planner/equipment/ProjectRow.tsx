import { memo } from "react";
import { LAYOUT } from '../constants';

interface ProjectQuantityCell {
  date: string;
  quantity: number;
  eventName?: string;
}

interface ProjectRowProps {
  projectName: string;
  equipmentId: string;
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  getProjectQuantityForDate: (projectName: string, equipmentId: string, dateStr: string) => ProjectQuantityCell | undefined;
}

const ProjectRowComponent = ({
  projectName,
  equipmentId,
  formattedDates,
  getProjectQuantityForDate
}: ProjectRowProps) => {
  return (
    <div 
      className="flex items-center border-b border-gray-300 bg-gray-700"
      style={{ height: LAYOUT.PROJECT_ROW_HEIGHT }}
    >
      {/* Timeline quantity cells only - minimal, clean design */}
      <div 
        className="flex items-center" 
        style={{ 
          minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px`,
          height: '100%'
        }}
      >
        {formattedDates.map(dateInfo => {
          const quantityCell = getProjectQuantityForDate(projectName, equipmentId, dateInfo.dateStr);
          const quantity = quantityCell?.quantity || 0;
          
          return (
            <div 
              key={dateInfo.date.toISOString()}
              className={`px-1 relative flex items-center justify-center ${
                dateInfo.isSelected || dateInfo.isToday ? 'z-10' : ''
              }`}
              style={{ width: '50px' }}
            >
              {/* Today indicator */}
              {dateInfo.isToday && (
                <div className="absolute inset-0 bg-gray-500/70 rounded-sm pointer-events-none" />
              )}
              {/* Selected indicator */}
              {dateInfo.isSelected && (
                <div className="absolute inset-0 border border-gray-300 rounded-sm pointer-events-none" />
              )}
              
              {/* Quantity indicator */}
              {quantity > 0 && (
                <div
                  className="min-w-[16px] h-4 px-1 rounded-full bg-gray-900 flex items-center justify-center"
                  title={`${projectName}\n${quantityCell?.eventName || 'Event'}: ${quantity} units\nDate: ${dateInfo.dateStr}`}
                >
                  <span className="text-[9px] font-bold text-white leading-none">
                    {quantity}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ProjectRow = memo(ProjectRowComponent, (prevProps, nextProps) => {
  // Re-render if project name changes
  if (prevProps.projectName !== nextProps.projectName || prevProps.equipmentId !== nextProps.equipmentId) {
    return false;
  }
  
  // Re-render if quantity function changes
  if (prevProps.getProjectQuantityForDate !== nextProps.getProjectQuantityForDate) {
    return false;
  }
  
  // Smart date comparison
  const prevDates = prevProps.formattedDates;
  const nextDates = nextProps.formattedDates;
  
  if (prevDates.length !== nextDates.length) {
    return false;
  }
  
  // Check if date range changed
  if (prevDates.length > 0 && nextDates.length > 0) {
    if (prevDates[0]?.dateStr !== nextDates[0]?.dateStr ||
        prevDates[prevDates.length - 1]?.dateStr !== nextDates[nextDates.length - 1]?.dateStr) {
      return false;
    }
  }
  
  // Check if selected date changed
  const prevSelectedIndex = prevDates.findIndex(d => d.isSelected);
  const nextSelectedIndex = nextDates.findIndex(d => d.isSelected);
  if (prevSelectedIndex !== nextSelectedIndex) {
    return false;
  }
  
  return true;
});

ProjectRow.displayName = 'ProjectRow';