/**
 * OPTIMIZED EQUIPMENT ROW - Performance-focused expansion
 * 
 * Key optimizations:
 * 1. CSS transforms instead of height changes
 * 2. Pre-rendered hidden project rows
 * 3. GPU-accelerated animations
 * 4. Minimal re-renders during expansion
 */

import { memo, useMemo } from "react";
import { EquipmentDayCell } from "./EquipmentDayCell";
import { ProjectRow } from "./ProjectRow";
import { LAYOUT } from '../constants';
import { FlattenedEquipment, EquipmentProjectUsage, ProjectQuantityCell } from '../types';

interface ExpandedEquipmentRowProps {
  equipment: FlattenedEquipment;
  isExpanded: boolean;
  equipmentUsage?: EquipmentProjectUsage;
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  getBookingForEquipment: (equipmentId: string, dateStr: string) => any;
  getProjectQuantityForDate: (projectName: string, equipmentId: string, dateStr: string) => ProjectQuantityCell | undefined;
  onToggleExpansion: (equipmentId: string) => void;
}

const ExpandedEquipmentRowComponent = ({
  equipment,
  isExpanded,
  equipmentUsage,
  formattedDates,
  getBookingForEquipment,
  getProjectQuantityForDate,
  onToggleExpansion
}: ExpandedEquipmentRowProps) => {
  
  // OPTIMIZATION 1: Pre-calculate styles to avoid repeated inline calculations
  const rowStyles = useMemo(() => ({
    timelineWidth: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px`,
    equipmentHeight: LAYOUT.EQUIPMENT_ROW_HEIGHT,
    projectHeight: LAYOUT.PROJECT_ROW_HEIGHT
  }), [formattedDates.length]);

  // TEMPORARY: Simplified project rows for debugging
  const projectRows = equipmentUsage?.projectNames.map((projectName) => (
    <ProjectRow
      key={`${equipment.id}-${projectName}`}
      projectName={projectName}
      equipmentId={equipment.id}
      formattedDates={formattedDates}
      getProjectQuantityForDate={getProjectQuantityForDate}
    />
  )) || [];

  // Debug: Check if component is rendering
  console.log(`🔧 ExpandedEquipmentRow rendering: ${equipment.name}, formattedDates:`, formattedDates.length);

  return (
    <div className="equipment-row-container">
      {/* Main equipment row - never changes */}
      <div 
        className="flex items-center border-b border-border hover:bg-muted/30 transition-colors"
        style={{ height: rowStyles.equipmentHeight }}
      >
        <div 
          className="flex items-center" 
          style={{ 
            minWidth: rowStyles.timelineWidth,
            height: '100%'
          }}
        >
          {formattedDates.map((dateInfo, index) => (
            <EquipmentDayCell
              key={dateInfo.date.toISOString()}
              equipment={equipment}
              dateInfo={dateInfo}
              getBookingForEquipment={getBookingForEquipment}
              isExpanded={isExpanded}
              onToggleExpansion={onToggleExpansion}
              isFirstCell={index === 0}
            />
          ))}
        </div>
      </div>
      
      {/* TEMPORARY: Simple conditional rendering for debugging */}
      {isExpanded && equipmentUsage && equipmentUsage.projectNames.length > 0 && (
        <div>
          {projectRows}
        </div>
      )}
    </div>
  );
};

// OPTIMIZATION 4: Smart memoization - only re-render when necessary
export const ExpandedEquipmentRow = memo(ExpandedEquipmentRowComponent, (prevProps, nextProps) => {
  // Equipment ID changed - must re-render
  if (prevProps.equipment.id !== nextProps.equipment.id) {
    return false;
  }
  
  // Expansion state changed - must re-render
  if (prevProps.isExpanded !== nextProps.isExpanded) {
    return false;
  }
  
  // Equipment usage changed (new projects) - must re-render
  if (prevProps.equipmentUsage?.projectNames.length !== nextProps.equipmentUsage?.projectNames.length) {
    return false;
  }
  
  // Function references changed - must re-render
  if (prevProps.getBookingForEquipment !== nextProps.getBookingForEquipment ||
      prevProps.getProjectQuantityForDate !== nextProps.getProjectQuantityForDate ||
      prevProps.onToggleExpansion !== nextProps.onToggleExpansion) {
    return false;
  }
  
  // Date range changed - must re-render
  if (prevProps.formattedDates.length !== nextProps.formattedDates.length ||
      prevProps.formattedDates[0]?.dateStr !== nextProps.formattedDates[0]?.dateStr) {
    return false;
  }
  
  // Everything same - skip re-render
  return true;
});

ExpandedEquipmentRow.displayName = 'ExpandedEquipmentRow';