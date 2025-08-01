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
                {monthSections.map((section) => (
                  <div 
                    key={`section-${section.monthYear}`}
                    className={`border-r border-border/30 flex items-center justify-center ${
                      section.isEven ? 'bg-muted/40' : 'bg-muted/20'
                    }`}
                    style={{ width: `${section.width}px`, minWidth: `${LAYOUT.DAY_CELL_WIDTH}px` }}
                  >
                    <span className="text-xs font-semibold text-foreground whitespace-nowrap px-2 py-1 bg-background/90 rounded-md shadow-sm border border-border/20">
                      {format(section.date, 'MMMM yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Date Header */}
            <div className="h-12 flex py-3">
              {formattedDates.map((dateInfo) => (
                <div key={dateInfo.date.toISOString()} className="px-1" style={{ width: LAYOUT.DAY_CELL_WIDTH }}>
                  <div
                    className={`h-8 flex flex-col items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer select-none ${
                      dateInfo.isSelected 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : dateInfo.isWeekendDay
                        ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateChange(dateInfo.date);
                    }}
                    title={format(dateInfo.date, 'EEEE, MMMM d, yyyy')}
                  >
                    <div className="text-[10px] leading-none">{format(dateInfo.date, 'EEE')[0]}</div>
                    <div className="text-xs font-medium leading-none">{format(dateInfo.date, 'd')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        

      </div>
    </div>
  );
}