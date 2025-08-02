import { format } from "date-fns";
import { Package } from "lucide-react";
import { LAYOUT } from '../constants';

interface MonthSection {
  monthYear: string;
  date: Date;
  startIndex: number;
  endIndex: number;
  width: number;
  isEven: boolean;
}

interface EquipmentCalendarHeaderProps {
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
  }>;
  monthSections: MonthSection[];
  onDateChange: (date: Date) => void;
  onHeaderScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  stickyHeadersRef: React.RefObject<HTMLDivElement>;
}

export function EquipmentCalendarHeader({
  formattedDates,
  monthSections,
  onDateChange,
  onHeaderScroll,
  stickyHeadersRef
}: EquipmentCalendarHeaderProps) {
  return (
    <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm">
      {/* Equipment Planner Title */}
      <div className="flex items-center gap-2 py-3 px-4 bg-background">
        <Package className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold">Equipment Planner</h3>
      </div>
      
      {/* Column Headers */}
      <div className="flex border-b border-border">
        {/* Left Header - Equipment Names */}
        <div 
          className="flex-shrink-0 bg-muted/90 backdrop-blur-sm border-r border-border"
          style={{ width: LAYOUT.EQUIPMENT_NAME_WIDTH }}
        >
          <div className="h-12 py-3 px-4 border-b border-border/50">
            <div className="text-sm font-semibold text-foreground">Equipment</div>
          </div>
          <div className="h-12 py-3 px-4">
            <div className="text-xs text-muted-foreground">Name / Stock</div>
          </div>
        </div>
        
        {/* Middle Header - Timeline */}
        <div 
          ref={stickyHeadersRef}
          className="flex-1 bg-muted/90 backdrop-blur-sm overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={onHeaderScroll}
        >
          <div style={{ width: `${formattedDates.length * LAYOUT.DAY_CELL_WIDTH}px` }}>
            {/* Month Header */}
            <div className="h-12 border-b border-border/50">
              <div className="flex">
                {monthSections.map((section, index) => {
                  // Check if this is a year transition (different year from previous section)
                  const prevSection = index > 0 ? monthSections[index - 1] : null;
                  const isYearTransition = prevSection && 
                    section.date.getFullYear() !== prevSection.date.getFullYear();
                  
                  return (
                    <div 
                      key={`section-${section.monthYear}`}
                      className={`border-r border-border/30 flex items-center justify-center relative ${
                        section.isEven ? 'bg-muted/40' : 'bg-muted/20'
                      }`}
                      style={{ width: `${section.width}px`, minWidth: `${LAYOUT.DAY_CELL_WIDTH}px` }}
                    >
                      {/* Year transition indicator */}
                      {isYearTransition && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l"></div>
                      )}
                      
                      <span className={`text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md shadow-sm border ${
                        isYearTransition 
                          ? 'bg-blue-50 text-blue-800 border-blue-200' 
                          : 'bg-background/90 text-foreground border-border/20'
                      }`}>
                        {format(section.date, 'MMMM yyyy')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Date Header */}
            <div className="h-12 flex py-3">
              {formattedDates.map((dateInfo, index) => {
                // Check if this is the first day of a new year
                const prevDate = index > 0 ? formattedDates[index - 1] : null;
                const isNewYear = prevDate && 
                  dateInfo.date.getFullYear() !== prevDate.date.getFullYear();
                const isNewMonth = prevDate && 
                  (dateInfo.date.getMonth() !== prevDate.date.getMonth() || isNewYear);
                
                return (
                  <div key={dateInfo.date.toISOString()} className="px-1 relative" style={{ width: LAYOUT.DAY_CELL_WIDTH }}>
                    {/* Year transition indicator for date cells */}
                    {isNewYear && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded"></div>
                    )}
                    
                    <div
                      className={`h-8 flex flex-col items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer select-none relative ${
                        dateInfo.isToday
                          ? 'bg-blue-500 text-white shadow-md' 
                          : isNewYear
                          ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                          : dateInfo.isWeekendDay
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          : 'text-muted-foreground hover:bg-muted/50'
                      } ${
                        dateInfo.isSelected 
                          ? 'ring-2 ring-blue-300' 
                          : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateChange(dateInfo.date);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        // Only handle double-click if this day is already selected
                        if (dateInfo.isSelected) {
                          const today = new Date();
                          onDateChange(today);
                        }
                      }}
                      title={`${format(dateInfo.date, 'EEEE, MMMM d, yyyy')}${dateInfo.isToday ? ' (Today)' : ''}${dateInfo.isSelected ? ' (Selected - Double-click to go to Today)' : ''}`}
                    >
                      <div className="text-[10px] leading-none">{format(dateInfo.date, 'EEE')[0]}</div>
                      <div className="text-xs font-medium leading-none">
                        {format(dateInfo.date, 'd')}
                        {/* Show year on first day of year */}
                        {isNewYear && (
                          <div className="text-[8px] text-blue-600 font-bold leading-none">
                            {format(dateInfo.date, 'yy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        

      </div>
    </div>
  );
}