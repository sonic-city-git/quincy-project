import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
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

interface EquipmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
}

export function EquipmentCalendar({ selectedDate, onDateChange, selectedOwner, viewMode = 'week' }: EquipmentCalendarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const isMonthView = viewMode === 'month';
  
  // Ref for timeline header sync
  const stickyHeadersRef = useRef<HTMLDivElement>(null);
  

  

  
  // Custom hooks
  const {
    timelineStart,
    timelineEnd,
    timelineDates,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    equipmentRowsRef,
    loadMoreDates,
  } = useEquipmentTimeline({ selectedDate });

  const scrollHandlers = useTimelineScroll({
    equipmentRowsRef,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    loadMoreDates,
    isMonthView,
  });

  // Enhanced scroll handler to sync headers with timeline content
  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Handle infinite scroll and drag functionality
    scrollHandlers.handleEquipmentScroll(e);
    
    // Sync timeline headers with content scroll position
    const scrollLeft = e.currentTarget.scrollLeft;
    if (stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = scrollLeft;
    }
  }, [scrollHandlers.handleEquipmentScroll]);

  // Enhanced mouse move handler for drag synchronization
  const handleTimelineMouseMove = useCallback((e: React.MouseEvent) => {
    scrollHandlers.handleMouseMove(e);
    
    // Sync headers during drag
    if (isDragging && equipmentRowsRef.current && stickyHeadersRef.current) {
      stickyHeadersRef.current.scrollLeft = equipmentRowsRef.current.scrollLeft;
    }
  }, [scrollHandlers.handleMouseMove, isDragging]);

  // Handle header scroll - sync back to timeline content (two-way sync)
  const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (equipmentRowsRef.current) {
      equipmentRowsRef.current.scrollLeft = scrollLeft;
    }
  }, []);

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
  
  // Granular booking state management for optimistic updates
  const { updateBookingState, getBookingState, batchUpdateBookings, clearStaleStates } = useGranularBookingState();

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

  // Group management
  const toggleGroup = (groupName: string, expandAllSubfolders = false) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      
      if (expandAllSubfolders) {
        // Cmd+click: Toggle main folder AND all its subfolders
        const isMainFolderExpanded = newSet.has(groupName);
        
        if (isMainFolderExpanded) {
          // Collapse main folder and all subfolders
          newSet.delete(groupName);
          
          // Find and collapse all subfolders for this main folder
          const mainFolder = folders.get(groupName);
          if (mainFolder?.subfolders) {
            Array.from((mainFolder.subfolders as Map<string, any>).keys()).forEach(subFolderName => {
              const subFolderKey = `${groupName}/${subFolderName}`;
              newSet.delete(subFolderKey);
            });
          }
        } else {
          // Expand main folder and all subfolders
          newSet.add(groupName);
          
          // Find and expand all subfolders for this main folder
          const mainFolder = folders.get(groupName);
          if (mainFolder?.subfolders) {
            Array.from((mainFolder.subfolders as Map<string, any>).keys()).forEach(subFolderName => {
              const subFolderKey = `${groupName}/${subFolderName}`;
              newSet.add(subFolderKey);
            });
          }
        }
      } else {
        // Normal click: Toggle only the clicked group
        if (newSet.has(groupName)) {
          newSet.delete(groupName);
        } else {
          newSet.add(groupName);
        }
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
          Array.from((mainFolder.subfolders as Map<string, any>).entries()).forEach(([_, subFolder]) => {
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
      {!folders || folders.size === 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No equipment bookings found for this week
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sticky Headers - Stick to main page scroll context */}
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm">
                {/* Equipment Planner Title */}
                <div className="flex items-center gap-2 py-3 px-4 bg-background">
                  <Package className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Equipment Planner</h3>
                </div>
                
                {/* Column Headers */}
                <div className="flex border-b border-border">
                  {/* Left Header - Equipment Names */}
                  <div className="w-[240px] flex-shrink-0 bg-muted/90 backdrop-blur-sm border-r border-border">
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
                    onScroll={handleHeaderScroll}
                  >
                    <div style={{ width: `${formattedDates.length * 50}px` }}>
                      {/* Month Header */}
                      <div className="h-12 border-b border-border/50">
                        <div className="flex">
                          {monthSections.map((section) => (
                            <div 
                              key={`section-${section.monthYear}`}
                              className={`border-r border-border/30 flex items-center justify-center ${
                                section.isEven ? 'bg-muted/40' : 'bg-muted/20'
                              }`}
                              style={{ width: `${section.width}px`, minWidth: '50px' }}
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
                          <div key={dateInfo.isoString} className="w-[50px] px-1">
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
                  
                  {/* Right Header - Lowest Available */}
                  <div className="w-[80px] flex-shrink-0 bg-muted/90 backdrop-blur-sm border-l border-border">
                    <div className="h-12 py-3 px-2 border-b border-border/50">
                      <div className="text-xs font-semibold text-foreground text-center">Lowest</div>
                    </div>
                    <div className="h-12 py-3 px-2">
                      <div className="text-xs text-muted-foreground text-center">Available</div>
                    </div>
                  </div>
                </div>
          </div>

          {/* Content Area - Separate from sticky headers */}
          <div className="border border-border rounded-lg overflow-hidden bg-background">
            <div className="flex">
              {/* Left Column - Equipment Names (Fixed during horizontal scroll) */}
              <div className="w-[240px] flex-shrink-0 border-r border-border">
                    {sortMainFolders(folders).map(([mainFolderName, mainFolder]) => (
                      <Collapsible key={mainFolderName} open={expandedGroups.has(mainFolderName)}>
                        <CollapsibleTrigger 
                          className="w-full group/folder"
                          onClick={(e) => {
                            e.preventDefault();
                            const isModifierClick = e.metaKey || e.ctrlKey; // Cmd on Mac, Ctrl on Windows/Linux
                            toggleGroup(mainFolderName, isModifierClick);
                          }}
                        >
                          <div className="h-[57px] flex items-center gap-3 px-4 bg-background hover:bg-muted/50 transition-colors border-b border-border">
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground group-data-[state=open]/folder:rotate-90 transition-transform" />
                            <FolderIcon className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold text-foreground">
                              {mainFolderName}
                              {/* Visual hint for cmd+click functionality */}
                              <span className="ml-2 text-xs text-muted-foreground opacity-0 group-hover/folder:opacity-100 transition-opacity">
                                {navigator.platform.includes('Mac') ? '⌘+click' : 'Ctrl+click'} for all
                              </span>
                            </span>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          {Array.from((mainFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                            <div key={equipmentId} className="h-[60px] flex items-center px-2 border-b border-border hover:bg-muted/30 transition-colors">
                              <div className="min-w-0 flex-1 pr-1">
                                <div className="text-xs font-medium truncate" title={equipment.name}>{equipment.name}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Stock: {equipment.stock}</div>
                              </div>
                            </div>
                          ))}
                          
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

                  {/* Middle Column - Timeline (Horizontally Scrollable) */}
                  <div 
                    ref={equipmentRowsRef}
                    className={`flex-1 overflow-x-auto scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onScroll={handleTimelineScroll}
                    onMouseDown={scrollHandlers.handleMouseDown}
                    onMouseMove={handleTimelineMouseMove}
                    onMouseUp={scrollHandlers.handleMouseUp}
                    onMouseLeave={scrollHandlers.handleMouseLeave}
                  >
                    <div style={{ minWidth: `${formattedDates.length * 50}px` }}>
                      {/* Timeline Data Only - Headers are sticky above */}
                      {sortMainFolders(folders).map(([mainFolderName, mainFolder]) => (
                        <Collapsible key={mainFolderName} open={expandedGroups.has(mainFolderName)}>
                          <div className="h-[57px] border-b border-border" />
                          
                          <CollapsibleContent>
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

                  {/* Right Column - Lowest Available (Fixed during horizontal scroll) */}
                  <div className="w-[80px] flex-shrink-0 border-l border-border">
                    {/* Lowest Values Only - Headers are sticky above */}
                    {sortMainFolders(folders).map(([mainFolderName, mainFolder]) => (
                      <Collapsible key={mainFolderName} open={expandedGroups.has(mainFolderName)}>
                        <div className="h-[57px] border-b border-border" />
                        
                        <CollapsibleContent>
                          {Array.from((mainFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                            <div key={equipmentId} className="h-[60px] flex items-center justify-center border-b border-border">
                              <span className="text-sm font-medium text-muted-foreground">
                                {getLowestAvailable(equipment)}
                              </span>
                            </div>
                          ))}
                          
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
        </>
      )}
    </div>
  );
}