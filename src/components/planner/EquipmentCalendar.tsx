import { useState, useEffect, useRef, useMemo, memo } from "react";
import { format, addMonths, addDays, isWeekend, isSameDay } from "date-fns";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Skeleton } from "../ui/skeleton";
import { 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  ChevronRightIcon,
  FolderIcon,
  AlertTriangle
} from "lucide-react";

import { useEquipmentTimeline } from './hooks/useEquipmentTimeline';
import { useTimelineScroll } from './hooks/useTimelineScroll';
import { useEquipmentData, useEquipmentVirtualization, useHorizontalVirtualization, useGranularBookingState, flattenEquipmentStructure } from './hooks/useEquipmentData';
import { FOLDER_ORDER, SUBFOLDER_ORDER } from '@/utils/folderSort';

// Helper functions to sort folders according to predefined order
const sortMainFolders = (folders: Map<string, any>) => {
  return Array.from(folders.entries()).sort((a, b) => {
    const [nameA] = a;
    const [nameB] = b;
    const indexA = FOLDER_ORDER.indexOf(nameA);
    const indexB = FOLDER_ORDER.indexOf(nameB);
    
    // Handle items not in FOLDER_ORDER (put them at the end, sorted alphabetically)
    if (indexA === -1 && indexB === -1) return nameA.localeCompare(nameB);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
};

const sortSubfolders = (subfolders: Map<string, any>, mainFolderName: string) => {
  return Array.from(subfolders.entries()).sort((a, b) => {
    const [nameA] = a;
    const [nameB] = b;
    const orderArray = SUBFOLDER_ORDER[mainFolderName] || [];
    const indexA = orderArray.indexOf(nameA);
    const indexB = orderArray.indexOf(nameB);
    
    // Handle items not in SUBFOLDER_ORDER (put them at the end, sorted alphabetically)
    if (indexA === -1 && indexB === -1) return nameA.localeCompare(nameB);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
};

// Optimistic Day Card Component
const OptimisticDayCard = memo(({ 
  equipment, 
  dateInfo, 
  getBookingsForEquipment,
  getBookingState,
  updateBookingState,
  onDateChange
}: {
  equipment: any;
  dateInfo: any;
  getBookingsForEquipment: (equipmentId: string, dateStr: string, equipment: any) => any;
  getBookingState: (equipmentId: string, dateStr: string) => any;
  updateBookingState: (equipmentId: string, dateStr: string, state: any) => void;
  onDateChange: (date: Date) => void;
}) => {
  const bookingState = getBookingState(equipment.id, dateInfo.dateStr);
  
  // Use optimistic data if available, otherwise fallback to main data
  const booking = bookingState.data || getBookingsForEquipment(equipment.id, dateInfo.dateStr, equipment);
  
  // Handle click with optimistic update
  const handleClick = () => {
    onDateChange(dateInfo.date);
    
    // Could add optimistic booking updates here in the future
    // For now, just handle the date change optimistically
  };

  return (
    <div 
      className={`w-[50px] px-1 relative ${
        dateInfo.isSelected ? 'z-10' : ''
      } ${dateInfo.isWeekendDay ? 'bg-gradient-to-b from-orange-50 to-orange-100 opacity-60' : ''}`}
    >
      {dateInfo.isSelected && (
        <div className="absolute inset-0 bg-blue-50/50 rounded pointer-events-none" />
      )}
      
      <div
        className="h-6 cursor-pointer transition-all duration-200 relative"
        onClick={handleClick}
        title={booking ? 
          `${equipment.name} - ${booking.total_used}/${equipment.stock} used${booking.is_overbooked ? ' (OVERBOOKED)' : ''}` : 
          `${equipment.name} - Available`
        }
      >
        {/* Show loading state if actively updating */}
        {bookingState.isLoading ? (
          <div className="h-full w-full rounded-md bg-blue-200 animate-pulse" />
        ) : booking ? (
          <div 
            className={`h-full w-full rounded-md shadow-sm ${
              booking.is_overbooked 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
            style={{ 
              opacity: Math.min(booking.total_used / equipment.stock, 1) * 0.7 + 0.3
            }}
          >
            {booking.is_overbooked && (
              <div className="flex items-center justify-center h-full">
                <AlertTriangle className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full rounded-md bg-muted hover:bg-muted/70 transition-colors" />
        )}
        
        {/* Error indicator */}
        {bookingState.error && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full" />
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if booking data or loading state changes
  const prevState = prevProps.getBookingState(prevProps.equipment.id, prevProps.dateInfo.dateStr);
  const nextState = nextProps.getBookingState(nextProps.equipment.id, nextProps.dateInfo.dateStr);
  
  return (
    prevProps.equipment.id === nextProps.equipment.id &&
    prevProps.dateInfo.dateStr === nextProps.dateInfo.dateStr &&
    prevProps.dateInfo.isSelected === nextProps.dateInfo.isSelected &&
    prevState.isLoading === nextState.isLoading &&
    prevState.data === nextState.data &&
    prevState.error === nextState.error
  );
});

// Virtualized Row Component for different row types
const VirtualizedRow = memo(({ 
  rowItem,
  visibleDates,
  visibleDateRange,
  totalDates,
  getBookingsForEquipment, 
  getBookingState,
  updateBookingState,
  onDateChange,
  expandedGroups,
  toggleGroup,
  style
}: { 
  rowItem: any;
  visibleDates: any[];
  visibleDateRange: { start: number; end: number };
  totalDates: number;
  getBookingsForEquipment: (equipmentId: string, dateStr: string, equipment: any) => any;
  getBookingState: (equipmentId: string, dateStr: string) => any;
  updateBookingState: (equipmentId: string, dateStr: string, state: any) => void;
  onDateChange: (date: Date) => void;
  expandedGroups: Set<string>;
  toggleGroup: (groupKey: string) => void;
  style?: React.CSSProperties;
}) => {
  
  if (rowItem.type === 'folder') {
    const isExpanded = expandedGroups.has(rowItem.name);
    return (
      <div style={style} className="h-[60px] flex items-center border-b border-border bg-muted/30">
        <div className="w-[260px] flex-shrink-0 px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroup(rowItem.name)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronRight className="h-3 w-3 rotate-90 transition-transform" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            <FolderIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{rowItem.name}</span>
          </div>
        </div>
        <div className="flex-1 bg-muted/10" style={{ minWidth: `${totalDates * 50}px` }} />
      </div>
    );
  }
  
  if (rowItem.type === 'subfolder') {
    const subFolderKey = `${rowItem.mainFolder}/${rowItem.name}`;
    const isExpanded = expandedGroups.has(subFolderKey);
    return (
      <div style={style} className="h-[60px] flex items-center border-b border-border bg-muted/15">
        <div className="w-[260px] flex-shrink-0 px-4">
          <div className="flex items-center gap-2 pl-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleGroup(subFolderKey)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronRight className="h-3 w-3 rotate-90 transition-transform" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
            <Package className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{rowItem.name}</span>
          </div>
        </div>
        <div className="flex-1 bg-muted/5" style={{ minWidth: `${totalDates * 50}px` }} />
      </div>
    );
  }
  
  if (rowItem.type === 'equipment' && rowItem.equipment) {
    const equipment = rowItem.equipment;
    const paddingClass = rowItem.level === 1 ? 'pl-8' : 'pl-12';
    
    return (
      <div style={style} className="h-[60px] flex items-center border-b border-border hover:bg-muted/30 transition-colors">
        {/* Fixed Equipment Name Column */}
        <div className="w-[260px] flex-shrink-0 px-4">
          <div className={`flex items-center gap-3 ${paddingClass}`}>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate">{equipment.name}</div>
              <div className="text-xs text-muted-foreground">Stock: {equipment.stock}</div>
            </div>
          </div>
        </div>
        
        {/* Date Indicators - Virtualized */}
        <div 
          className="flex-1 relative overflow-hidden" 
          style={{ minWidth: `${totalDates * 50}px` }}
        >
          {/* Background spacer for full timeline width */}
          <div style={{ width: `${totalDates * 50}px`, height: '100%', position: 'absolute' }} />
          
          {/* Only render visible dates */}
          <div 
            className="flex absolute" 
            style={{ 
              left: `${visibleDateRange.start * 50}px`,
              width: `${visibleDates.length * 50}px`
            }}
          >
            {visibleDates.map(dateInfo => (
              <OptimisticDayCard
                key={dateInfo.isoString}
                equipment={equipment}
                dateInfo={dateInfo}
                getBookingsForEquipment={getBookingsForEquipment}
                getBookingState={getBookingState}
                updateBookingState={updateBookingState}
                onDateChange={onDateChange}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}, (prevProps, nextProps) => {
  // Custom memoization for different row types
  if (prevProps.rowItem.type !== nextProps.rowItem.type) return false;
  if (prevProps.rowItem.id !== nextProps.rowItem.id) return false;
  
  // Check visible date range changes
  if (prevProps.visibleDateRange.start !== nextProps.visibleDateRange.start ||
      prevProps.visibleDateRange.end !== nextProps.visibleDateRange.end) return false;
  
  if (prevProps.rowItem.type === 'equipment') {
    return (
      prevProps.rowItem.equipment?.id === nextProps.rowItem.equipment?.id &&
      prevProps.rowItem.equipment?.stock === nextProps.rowItem.equipment?.stock &&
      prevProps.totalDates === nextProps.totalDates
    );
  }
  
  // For folder/subfolder rows, just check basic props
  return (
    prevProps.totalDates === nextProps.totalDates &&
    prevProps.expandedGroups === nextProps.expandedGroups
  );
});

interface EquipmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
}

export function EquipmentCalendar({ selectedDate, onDateChange, selectedOwner, viewMode = 'week' }: EquipmentCalendarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const isMonthView = viewMode === 'month';
  
  // Simplified: Only one master scroll area needed
  // Remove datesRowRef and isScrollingRef - no longer needed
  
  // Custom hooks
  const {
    timelineStart,
    timelineEnd,
    timelineDates,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    equipmentRowsRef, // Only master scroll area
    loadMoreDates,
  } = useEquipmentTimeline({ selectedDate });

  // Simplified: Use hook's scroll handlers directly - no duplicate logic needed
  const scrollHandlers = useTimelineScroll({
    equipmentRowsRef, // Only master scroll area needed
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    loadMoreDates,
    isMonthView,
  });

  const {
    mainFolders,
    isLoading,
    getBookingsForEquipment,
    getBookingsForEquipmentWithDate,
  } = useEquipmentData({
    periodStart: timelineStart,
    periodEnd: timelineEnd,
    selectedOwner,
  });

  // Ensure mainFolders is properly typed
  const folders = mainFolders || new Map();

  // Virtualization setup (currently disabled for stability)
  // const { visibleRange, updateTotalRows } = useEquipmentVirtualization(equipmentRowsRef, 60, 5);
  // const { visibleDateRange, updateTotalColumns } = useHorizontalVirtualization(equipmentRowsRef, 50, 10);
  
  // Granular booking state management for optimistic updates
  const { updateBookingState, getBookingState, batchUpdateBookings, clearStaleStates } = useGranularBookingState();

  // Virtualization structure helpers (disabled for now)
  // const flattenedEquipment = useMemo(() => {
  //   return flattenEquipmentStructure(mainFolders);
  // }, [mainFolders]);

  // const visibleEquipment = useMemo(() => {
  //   // ... filtering logic disabled for stability
  // }, [flattenedEquipment, expandedGroups]);

  // useEffect(() => {
  //   updateTotalRows(visibleEquipment.length);
  // }, [visibleEquipment.length, updateTotalRows]);

  // Cleanup stale booking states periodically
  useEffect(() => {
    const interval = setInterval(() => {
      clearStaleStates();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [clearStaleStates]);

  // Initialize main folders as expanded when data loads
  useEffect(() => {
    if (mainFolders && mainFolders.size > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(Array.from(mainFolders.keys())));
    }
  }, [mainFolders, expandedGroups.size]);

  // Simplified: No complex sync needed with single scroll area

  // Group management
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Pre-format dates for performance - avoid repeated format() calls
  const formattedDates = useMemo(() => {
    return timelineDates.map(date => ({
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      isoString: date.toISOString(),
      isWeekendDay: isWeekend(date),
      isSelected: isSameDay(date, selectedDate),
      monthYear: format(date, 'yyyy-MM')
    }));
  }, [timelineDates, selectedDate]);

  // Virtualization column tracking (disabled for now)
  // useEffect(() => {
  //   updateTotalColumns(formattedDates.length);
  // }, [formattedDates.length, updateTotalColumns]);

  // const visibleDates = useMemo(() => {
  //   return formattedDates.slice(visibleDateRange.start, visibleDateRange.end);
  // }, [formattedDates, visibleDateRange]);

  // Month sections with alternating backgrounds  
  const monthSections = useMemo(() => {
    const sections = [];
    let currentSection = null;
    
    formattedDates.forEach((dateInfo, index) => {
      if (!currentSection || currentSection.monthYear !== dateInfo.monthYear) {
        // Finish previous section
        if (currentSection) {
          currentSection.endIndex = index - 1;
          currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * 50;
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          monthYear: dateInfo.monthYear,
          date: dateInfo.date,
          startIndex: index,
          endIndex: index,
          width: 0,
          isEven: sections.length % 2 === 0
        };
      }
    });
    
    // Don't forget the last section
    if (currentSection) {
      currentSection.endIndex = formattedDates.length - 1;
      currentSection.width = (currentSection.endIndex - currentSection.startIndex + 1) * 50;
      sections.push(currentSection);
    }
    
    return sections;
  }, [formattedDates]);

  // Month sections are used directly for labels inside scroll area

  // Headers are now inside scroll area - no sync needed

  // Direct booking lookup - getBookingsForEquipment is already O(1) optimized
  // No need for additional caching layer that slows things down

  // Memoized lowest stock calculations - only recalculate when data changes
  const lowestStockCache = useMemo(() => {
    const cache = new Map<string, number>();
    
    // Only calculate for visible equipment to avoid blocking render
    if (folders && folders.size > 0) {
      requestIdleCallback(() => {
        // Calculate in background when browser is idle
        Array.from(folders.entries()).forEach(([_, mainFolder]) => {
          Array.from((mainFolder.equipment as Map<string, any>).entries()).forEach(([equipmentId, equipment]) => {
            let lowest = equipment.stock;
            
            formattedDates.forEach(dateInfo => {
              const booking = getBookingsForEquipment(equipment.id, dateInfo.dateStr, equipment);
              if (booking) {
                const available = equipment.stock - booking.total_used;
                lowest = Math.min(lowest, available);
              }
            });
            
            cache.set(equipmentId, Math.max(0, lowest));
          });
          
          // Also handle subfolders
          Array.from(mainFolder.subfolders.entries()).forEach(([_, subFolder]) => {
            Array.from((subFolder.equipment as Map<string, any>).entries()).forEach(([equipmentId, equipment]) => {
              let lowest = equipment.stock;
              
              formattedDates.forEach(dateInfo => {
                const booking = getBookingsForEquipment(equipment.id, dateInfo.dateStr, equipment);
                if (booking) {
                  const available = equipment.stock - booking.total_used;
                  lowest = Math.min(lowest, available);
                }
              });
              
              cache.set(equipmentId, Math.max(0, lowest));
            });
          });
        });
      });
    }
    
    return cache;
  }, [folders, formattedDates, getBookingsForEquipment]);

  // Fast lookup function that doesn't block render
  const getLowestAvailable = (equipment: any) => {
    return lowestStockCache.get(equipment.id) ?? equipment.stock;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sticky Equipment Planner Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        {/* Main Title */}
        <div className="flex items-center gap-2 py-3 px-1">
          <Package className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold">Equipment Planner</h3>
        </div>


      </div>

      <Card>
        <CardContent className="p-0">
          {!folders || folders.size === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No equipment bookings found for this week
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline Container with proper unified scroll */}
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                {/* Three Column Layout */}
                <div className="flex">
                  {/* Equipment Names Column - Fixed */}
                  <div className="w-[240px] flex-shrink-0 equipment-calendar-column">
                    {/* Names Header */}
                    <div className="h-12 py-3 px-4 bg-muted/20 border-b border-border/50">
                      <div className="text-sm font-semibold text-foreground">Equipment</div>
                    </div>
                    <div className="py-3 px-4 bg-muted/10 border-b border-border">
                      <div className="text-xs text-muted-foreground">Name / Stock</div>
                    </div>
                    
                    {/* Equipment Names */}
                    {sortMainFolders(folders).map(([mainFolderName, mainFolder]) => (
                      <Collapsible key={mainFolderName} open={expandedGroups.has(mainFolderName)} onOpenChange={() => toggleGroup(mainFolderName)}>
                        <CollapsibleTrigger className="w-full group/folder">
                          <div className="h-[57px] flex items-center gap-3 px-4 bg-background hover:bg-muted/50 transition-colors border-b border-border">
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-data-[state=open]/folder:rotate-90 transition-transform" />
                            <FolderIcon className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold text-foreground">{mainFolderName}</span>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          {/* Equipment directly in main folder */}
                          {Array.from((mainFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                            <div key={equipmentId} className="h-[60px] flex items-center px-2 border-b border-border hover:bg-muted/30 transition-colors">
                              <div className="min-w-0 flex-1 pr-1">
                                <div className="text-xs font-medium truncate" title={equipment.name}>{equipment.name}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Stock: {equipment.stock}</div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Subfolders */}
                          {sortSubfolders(mainFolder.subfolders, mainFolderName).map(([subFolderName, subFolder]) => {
                            const subFolderKey = `${mainFolderName}/${subFolderName}`;
                            return (
                              <Collapsible key={subFolderName} open={expandedGroups.has(subFolderKey)} onOpenChange={() => toggleGroup(subFolderKey)}>
                                <CollapsibleTrigger className="w-full group/subfolder">
                                  <div className="h-[41px] flex items-center gap-3 px-4 pl-12 bg-muted/50 hover:bg-muted transition-colors border-t border-border">
                                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-data-[state=open]/subfolder:rotate-90 transition-transform" />
                                    <span className="text-sm font-medium text-muted-foreground">{subFolderName}</span>
                                  </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  {Array.from((subFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                                    <div key={equipmentId} className="h-[60px] flex items-center px-4 border-b border-border hover:bg-muted/30 transition-colors">
                                      <div className="min-w-0 flex-1 pr-1">
                                        <div className="text-xs font-medium truncate" title={equipment.name}>{equipment.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Stock: {equipment.stock}</div>
                                      </div>
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>

                  {/* Unified Timeline Area - Scrollable */}
                  <div 
                    className={`flex-1 overflow-x-auto scrollbar-hide equipment-calendar-column ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    ref={equipmentRowsRef}
                    onScroll={scrollHandlers.handleEquipmentScroll}
                    onMouseDown={scrollHandlers.handleMouseDown}
                    onMouseMove={scrollHandlers.handleMouseMove}
                    onMouseUp={scrollHandlers.handleMouseUp}
                    onMouseLeave={scrollHandlers.handleMouseLeave}
                  >
                    <div style={{ minWidth: `${formattedDates.length * 50}px` }}>
                      {/* Month Header Row */}
                      <div className="border-b border-border/50 bg-muted/30">
                        <div className="flex">
                          {/* Month sections with alternating backgrounds and labels */}
                          {monthSections.map((section) => (
                            <div 
                              key={`section-${section.monthYear}`}
                              className={`h-12 border-r border-border/30 flex items-center justify-center ${
                                section.isEven 
                                  ? 'bg-muted/40' 
                                  : 'bg-muted/20'
                              }`}
                              style={{ 
                                width: `${section.width}px`,
                                minWidth: '50px'
                              }}
                            >
                              <span className="text-xs font-semibold text-foreground whitespace-nowrap px-2 py-1 bg-background/90 rounded-md shadow-sm border border-border/20">
                                {format(section.date, 'MMMM yyyy')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Date Header Row */}
                      <div className="border-b border-border bg-muted">
                        <div className="flex py-3">
                          {formattedDates.map((dateInfo) => (
                            <div 
                              key={dateInfo.isoString} 
                              className="w-[50px] px-1"
                            >
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

                      {/* Equipment Timeline Data */}
                      {sortMainFolders(folders).map(([mainFolderName, mainFolder]) => (
                        <Collapsible key={mainFolderName} open={expandedGroups.has(mainFolderName)}>
                          <div className="h-[57px] border-b border-border" />
                          
                          <CollapsibleContent>
                            {/* Equipment directly in main folder */}
                            {Array.from((mainFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                              <div key={equipmentId} className="h-[60px] flex items-center border-b border-border hover:bg-muted/30 transition-colors">
                                <div className="flex" style={{ minWidth: `${formattedDates.length * 50}px` }}>
                                  {formattedDates.map(dateInfo => (
                                    <OptimisticDayCard
                                      key={dateInfo.isoString}
                                      equipment={equipment}
                                      dateInfo={dateInfo}
                                      getBookingsForEquipment={getBookingsForEquipment}
                                      getBookingState={getBookingState}
                                      updateBookingState={updateBookingState}
                                      onDateChange={onDateChange}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                            
                            {/* Subfolders */}
                            {sortSubfolders(mainFolder.subfolders, mainFolderName).map(([subFolderName, subFolder]) => {
                              const subFolderKey = `${mainFolderName}/${subFolderName}`;
                              return (
                                <Collapsible key={subFolderName} open={expandedGroups.has(subFolderKey)}>
                                  <div className="h-[41px] border-t border-border" />
                                  <CollapsibleContent>
                                    {Array.from((subFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                                      <div key={equipmentId} className="h-[60px] flex items-center border-b border-border hover:bg-muted/30 transition-colors">
                                        <div className="flex" style={{ minWidth: `${formattedDates.length * 50}px` }}>
                                          {formattedDates.map(dateInfo => (
                                            <OptimisticDayCard
                                              key={dateInfo.isoString}
                                              equipment={equipment}
                                              dateInfo={dateInfo}
                                              getBookingsForEquipment={getBookingsForEquipment}
                                              getBookingState={getBookingState}
                                              updateBookingState={updateBookingState}
                                              onDateChange={onDateChange}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            })}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>

                  {/* Lowest Column - Fixed */}
                  <div className="w-[70px] flex-shrink-0 equipment-calendar-column">
                    {/* Lowest Header */}
                    <div className="h-12 py-3 px-4 bg-muted/20 border-b border-border/50">
                      <div className="text-sm font-semibold text-foreground text-center">Lowest</div>
                    </div>
                    <div className="py-3 px-4 bg-muted/10 border-b border-border">
                      <div className="text-xs text-muted-foreground text-center">Available</div>
                    </div>

                    {/* Lowest Values */}
                    {sortMainFolders(folders).map(([mainFolderName, mainFolder]) => (
                      <Collapsible key={mainFolderName} open={expandedGroups.has(mainFolderName)}>
                        <div className="h-[57px] border-b border-border" />
                        
                        <CollapsibleContent>
                          {/* Equipment directly in main folder */}
                          {Array.from((mainFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                            <div key={equipmentId} className="h-[60px] flex items-center justify-center border-b border-border">
                              <span className="text-sm font-medium text-muted-foreground">
                                {getLowestAvailable(equipment)}
                              </span>
                            </div>
                          ))}
                          
                          {/* Subfolders */}
                          {sortSubfolders(mainFolder.subfolders, mainFolderName).map(([subFolderName, subFolder]) => {
                            const subFolderKey = `${mainFolderName}/${subFolderName}`;
                            return (
                              <Collapsible key={subFolderName} open={expandedGroups.has(subFolderKey)}>
                                <div className="h-[41px] border-t border-border" />
                                <CollapsibleContent>
                                  {Array.from((subFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                                    <div key={equipmentId} className="h-[60px] flex items-center justify-center border-b border-border">
                                      <span className="text-sm font-medium text-muted-foreground">
                                        {getLowestAvailable(equipment)}
                                      </span>
                                    </div>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}