// Shared timeline type definition
export interface SharedTimeline {
  timelineStart: Date;
  timelineEnd: Date;
  timelineDates: Date[];
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragStart: { x: number; scrollLeft: number };
  setDragStart: (start: { x: number; scrollLeft: number }) => void;
  equipmentRowsRef: React.RefObject<HTMLDivElement>;
  loadMoreDates: (direction: 'start' | 'end') => void;
  scrollToDate: (date: Date, animate?: boolean) => void;
}