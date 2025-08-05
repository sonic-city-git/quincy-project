import { memo, useMemo } from "react";
import { LAYOUT } from '../constants';
import { ProjectQuantityCell } from '../types';
import { formatPlannerTooltip } from '../../../../utils/tooltipFormatters';

// Crew role assignment data for project rows
export interface CrewRoleCell {
  date: string;
  role: string;
  eventName: string;
  projectName: string;
  location?: string;
  eventType?: string;
}

interface ProjectRowProps {
  projectName: string;
  equipmentId: string; // In crew mode, this is actually crewMemberId
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  getProjectQuantityForDate?: (projectName: string, equipmentId: string, dateStr: string) => ProjectQuantityCell | undefined;
  getCrewRoleForDate?: (projectName: string, crewMemberId: string, dateStr: string) => CrewRoleCell | undefined;
  isCrew?: boolean; // Flag to indicate crew mode vs equipment mode
}

const ProjectRowComponent = ({
  projectName,
  equipmentId,
  formattedDates,
  getProjectQuantityForDate,
  getCrewRoleForDate,
  isCrew = false
}: ProjectRowProps) => {
  // PERFORMANCE: Pre-calculate data with stable memoization
  const dataMap = useMemo(() => {
    const map = new Map<string, ProjectQuantityCell | CrewRoleCell>();
    formattedDates.forEach(dateInfo => {
      if (isCrew && getCrewRoleForDate) {
        const roleCell = getCrewRoleForDate(projectName, equipmentId, dateInfo.dateStr);
        if (roleCell) {
          map.set(dateInfo.dateStr, roleCell);
        }
      } else if (!isCrew && getProjectQuantityForDate) {
        const quantityCell = getProjectQuantityForDate(projectName, equipmentId, dateInfo.dateStr);
        if (quantityCell) {
          map.set(dateInfo.dateStr, quantityCell);
        }
      }
    });
    return map;
  }, [
    projectName, 
    equipmentId, 
    isCrew,
    // More stable dependency - only recompute if date range changes
    formattedDates.length > 0 ? `${formattedDates[0].dateStr}-${formattedDates[formattedDates.length - 1].dateStr}` : '',
    getProjectQuantityForDate,
    getCrewRoleForDate
  ]);

  return (
    <div 
      className="project-row flex items-center border-b border-border/50 bg-muted/20"
      style={{ height: LAYOUT.PROJECT_ROW_HEIGHT }}
    >
      {/* Timeline quantity cells ONLY - no duplicate name column! */}
      <div 
        className="flex items-center" 
        style={{ 
          minWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px`,
          height: '100%'
        }}
      >
        {formattedDates.map(dateInfo => {
          const dataCell = dataMap.get(dateInfo.dateStr);
          
          // Extract values based on mode
          const quantity = (!isCrew && dataCell && 'quantity' in dataCell) ? dataCell.quantity : 0;
          const role = (isCrew && dataCell && 'role' in dataCell) ? dataCell.role : '';
          const hasData = isCrew ? !!role : quantity > 0;
          
          return (
            <div
              key={dateInfo.date.toISOString()}
              className="px-1 relative flex items-center justify-center"
              style={{ width: LAYOUT.DAY_CELL_WIDTH }}
            >
              
              {/* Data indicator - quantity for equipment, role for crew */}
              {hasData && (
                <div
                  className="min-w-[20px] h-5 px-2 rounded-full bg-gray-600 flex items-center justify-center"
                  title={formatPlannerTooltip({
                    date: dateInfo.dateStr,
                    // Crew project row data
                    ...(isCrew && dataCell && 'role' in dataCell && {
                      eventName: dataCell.eventName,
                      projectName: dataCell.projectName,
                      role: dataCell.role,
                      location: dataCell.location
                    }),
                    // Equipment project row data
                    ...(!isCrew && {
                      eventName: dataCell?.eventName || 'Event',
                      projectName: projectName,
                      // For equipment, show quantity as additional info
                      stock: quantity
                    })
                  })}
                >
                  <span className="text-xs font-medium text-white leading-[0] text-center" style={{ transform: 'translateY(-0.5px)' }}>
                    {isCrew ? role : quantity}
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
  // Re-render if project name, equipment/crew ID, or mode changes
  if (prevProps.projectName !== nextProps.projectName || 
      prevProps.equipmentId !== nextProps.equipmentId ||
      prevProps.isCrew !== nextProps.isCrew) {
    return false;
  }
  
  // Re-render if data functions change
  if (prevProps.getProjectQuantityForDate !== nextProps.getProjectQuantityForDate ||
      prevProps.getCrewRoleForDate !== nextProps.getCrewRoleForDate) {
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