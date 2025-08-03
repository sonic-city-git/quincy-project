// Shared timeline type definition
export interface SharedTimeline {
  // Core timeline state
  timelineStart: Date;
  timelineEnd: Date;
  timelineDates: Date[];
  
  // Formatted date data for rendering
  formattedDates: Array<{
    date: Date;
    dateStr: string;
    isToday: boolean;
    isSelected: boolean;
    isWeekendDay: boolean;
    isoString: string;
    monthYear: string;
  }>;
  
  // Month sections for headers
  monthSections: Array<{
    monthYear: string;
    date: Date;
    startIndex: number;
    endIndex: number;
    width: number;
    isEven: boolean;
    isNewYear?: boolean;
  }>;
  
  // Drag interaction state
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragStart: { x: number; scrollLeft: number };
  setDragStart: (start: { x: number; scrollLeft: number }) => void;
  
  // Scroll container refs
  equipmentRowsRef: React.RefObject<HTMLDivElement>;
  stickyHeadersRef: React.RefObject<HTMLDivElement>;
  
  // Timeline management functions
  loadMoreDates: (direction: 'start' | 'end') => void;
  scrollToDate: (date: Date, animate?: boolean) => void;
  
  // Visible range for performance optimization
  visibleTimelineStart: Date;
  visibleTimelineEnd: Date;
}