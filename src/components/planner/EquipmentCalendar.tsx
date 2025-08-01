import { useState } from "react";
import { format, addMonths, addDays, isWeekend, isSameDay } from "date-fns";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
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
import { useEquipmentData } from './hooks/useEquipmentData';

interface EquipmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
}

export function EquipmentCalendar({ selectedDate, onDateChange, selectedOwner, viewMode = 'week' }: EquipmentCalendarProps) {
  const [currentPeriod, setCurrentPeriod] = useState(selectedDate);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const isMonthView = viewMode === 'month';
  
  // Custom hooks
  const {
    timelineStart,
    timelineEnd,
    timelineDates,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    timelineRef,
    equipmentRowsRef,
    loadMoreDates,
  } = useEquipmentTimeline({ selectedDate });

  const {
    handleScroll,
    handleEquipmentScroll,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    navigatePeriod,
    navigateDays,
  } = useTimelineScroll({
    timelineRef,
    equipmentRowsRef,
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
  } = useEquipmentData({
    periodStart: timelineStart,
    periodEnd: timelineEnd,
    selectedOwner,
  });

  // Ensure mainFolders is properly typed
  const folders = mainFolders || new Map();

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
      {/* Card Title */}
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-semibold">Equipment Calendar</h3>
      </div>

      {/* Sticky Timeline Header */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="flex items-center justify-between py-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[160px] text-center">
              {isMonthView 
                ? format(currentPeriod, 'MMMM yyyy')
                : `${format(timelineStart, 'MMM d')} - ${format(timelineEnd, 'MMM d, yyyy')}`
              }
            </span>
            <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigateDays('prev')}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {isMonthView ? 'Week' : 'Day'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigateDays('next')}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Timeline Header with Fixed Columns */}
        <div className="flex bg-muted border-b border-border">
          {/* Fixed Equipment Column */}
          <div className="w-[260px] flex-shrink-0 py-3 px-4">
            <div className="text-sm font-semibold text-foreground">Equipment</div>
          </div>
          
          {/* Scrollable Dates Column */}
          <div 
            ref={timelineRef}
            className={`flex-1 overflow-x-auto scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ willChange: 'scroll-position' }}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="flex py-3"
              style={{ 
                minWidth: `${timelineDates.length * 50}px`,
                willChange: 'transform'
              }}
            >
              {timelineDates.map((date, index) => {
                const isFirstOfMonth = index === 0 || date.getDate() === 1;
                return (
                  <div 
                    key={date.toISOString()} 
                    className="w-[50px] px-1"
                  >
                    <div
                      className={`h-8 flex flex-col items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer select-none relative ${
                        isSameDay(date, selectedDate) 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : isWeekend(date)
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateChange(date);
                      }}
                      title={format(date, 'EEEE, MMMM d, yyyy')}
                    >
                      {isFirstOfMonth && (
                        <div className="absolute -top-6 left-0 text-[10px] font-semibold text-muted-foreground">
                          {format(date, 'MMM')}
                        </div>
                      )}
                      <div className="text-[10px] leading-none">{format(date, 'EEE')[0]}</div>
                      <div className="text-xs font-medium leading-none">{format(date, 'd')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Fixed Stock Column */}
          <div className="w-[70px] flex-shrink-0 py-3 px-4">
            <div className="text-sm font-semibold text-foreground text-center">Stock</div>
          </div>
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
                {/* Simple structure for now - will rebuild properly */}
                <div className="flex">
                  {/* Equipment Names Column */}
                  <div className="w-[260px] flex-shrink-0">
                    {Array.from(folders.entries()).map(([mainFolderName, mainFolder]) => (
                      <div key={mainFolderName}>
                        <div className="py-4 px-4 border-b border-border">
                          <span className="text-sm font-semibold">{mainFolderName}</span>
                        </div>
                        {Array.from((mainFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                          <div key={equipmentId} className="py-3 px-8 border-b border-border">
                            <div className="text-sm font-medium">{equipment.name}</div>
                            <div className="text-xs text-muted-foreground">Stock: {equipment.stock}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Scrollable Date Area */}
                  <div 
                    ref={equipmentRowsRef}
                    className="flex-1 overflow-x-auto scrollbar-hide"
                    style={{ willChange: 'scroll-position' }}
                    onScroll={handleEquipmentScroll}
                  >
                    <div style={{ minWidth: `${timelineDates.length * 50}px` }}>
                      {Array.from(folders.entries()).map(([mainFolderName, mainFolder]) => (
                        <div key={mainFolderName}>
                          <div className="h-[57px] border-b border-border" />
                          {Array.from((mainFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                            <div key={equipmentId} className="flex py-3 border-b border-border">
                              {timelineDates.map(date => {
                                const booking = getBookingsForEquipment(equipment.id, date, equipment);
                                const isSelected = isSameDay(date, selectedDate);
                                const isWeekendDay = isWeekend(date);
                                
                                return (
                                  <div 
                                    key={date.toISOString()} 
                                    className={`w-[50px] px-1 relative ${
                                      isSelected ? 'z-10' : ''
                                    } ${isWeekendDay ? 'bg-gradient-to-b from-orange-50 to-orange-100 opacity-60' : ''}`}
                                  >
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-blue-50/50 rounded pointer-events-none" />
                                    )}
                                    
                                    <div
                                      className="h-6 cursor-pointer transition-all duration-200 relative"
                                      onClick={() => onDateChange(date)}
                                      title={booking ? 
                                        `${equipment.name} - ${booking.total_used}/${equipment.stock} used${booking.is_overbooked ? ' (OVERBOOKED)' : ''}` : 
                                        `${equipment.name} - Available`
                                      }
                                    >
                                      {booking ? (
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
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stock Column */}
                  <div className="w-[70px] flex-shrink-0">
                    {Array.from(folders.entries()).map(([mainFolderName, mainFolder]) => (
                      <div key={mainFolderName}>
                        <div className="h-[57px] border-b border-border" />
                        {Array.from((mainFolder.equipment as Map<string, any>).entries()).map(([equipmentId, equipment]) => (
                          <div key={equipmentId} className="flex items-center justify-center py-3 border-b border-border">
                            <span className="text-sm font-medium text-muted-foreground">
                              {equipment.stock}
                            </span>
                          </div>
                        ))}
                      </div>
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