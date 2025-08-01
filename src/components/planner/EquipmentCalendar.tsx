import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Package, ChevronLeft, ChevronRight, AlertTriangle, ChevronDown, ChevronRight as ChevronRightIcon } from "lucide-react";
import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, getDaysInMonth, isWeekend } from "date-fns";
import { cn } from "@/lib/utils";

interface EquipmentBooking {
  equipment_id: string;
  equipment_name: string;
  stock: number;
  date: string;
  folder_name: string;
  parent_folder_name?: string;
  bookings: Array<{
    quantity: number;
    project_name: string;
    event_name: string;
  }>;
  total_used: number;
  is_overbooked: boolean;
}

interface EquipmentItem {
  id: string;
  name: string;
  stock: number;
  bookings: Map<string, EquipmentBooking>;
}

interface SubFolder {
  name: string;
  equipment: Map<string, EquipmentItem>;
}

interface MainFolder {
  name: string;
  equipment: Map<string, EquipmentItem>; // Equipment directly in main folder
  subfolders: Map<string, SubFolder>; // Subfolders within this main folder
}

interface EquipmentCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
}

export function EquipmentCalendar({ selectedDate, onDateChange, selectedOwner, viewMode = 'week' }: EquipmentCalendarProps) {
  const [currentPeriod, setCurrentPeriod] = useState(selectedDate);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Generate dates based on view mode
  const isMonthView = viewMode === 'month';
  
  const periodStart = isMonthView 
    ? startOfMonth(currentPeriod)
    : startOfWeek(currentPeriod, { weekStartsOn: 1 });
  
  const periodEnd = isMonthView 
    ? endOfMonth(currentPeriod)
    : endOfWeek(currentPeriod, { weekStartsOn: 1 });
  
  const periodDates = isMonthView 
    ? Array.from({ length: getDaysInMonth(currentPeriod) }, (_, i) => addDays(startOfMonth(currentPeriod), i))
    : Array.from({ length: 7 }, (_, i) => addDays(periodStart, i));

  const { data: mainFolders, isLoading } = useQuery({
    queryKey: ['equipment-planner', format(periodStart, 'yyyy-MM-dd'), format(periodEnd, 'yyyy-MM-dd'), selectedOwner, viewMode],
    queryFn: async () => {
      // Get equipment bookings and folders separately, then combine in JavaScript
      const [bookingsResult, foldersResult] = await Promise.all([
        // Get equipment bookings
        supabase
          .from('project_event_equipment')
          .select(`
            equipment_id,
            quantity,
            equipment:equipment_id!inner (
              name,
              stock,
              folder_id
            ),
            project_events!inner (
              date,
              name,
              project:projects!inner (
                name,
                owner_id
              )
            )
          `)
          .gte('project_events.date', format(periodStart, 'yyyy-MM-dd'))
          .lte('project_events.date', format(periodEnd, 'yyyy-MM-dd'))
          .then(query => selectedOwner ? query.eq('project_events.project.owner_id', selectedOwner) : query),
        
        // Get all folders
        supabase
          .from('equipment_folders')
          .select('*')
      ]);

      const { data: bookings, error: bookingsError } = bookingsResult;
      const { data: folders, error: foldersError } = foldersResult;

      if (bookingsError) throw bookingsError;
      if (foldersError) throw foldersError;

      // Create folder lookup maps
      const folderMap = new Map(folders?.map(f => [f.id, f]) || []);
      
      // Group bookings by folder hierarchy (main folders and subfolders)
      const mainFoldersMap = new Map<string, MainFolder>();
      
      bookings?.forEach(booking => {
        const equipmentId = booking.equipment_id;
        const equipmentName = booking.equipment.name;
        const stock = booking.equipment.stock || 0;
        const date = booking.project_events.date;
        
        // Determine folder hierarchy
        const folder = folderMap.get(booking.equipment.folder_id);
        const parentFolder = folder?.parent_id ? folderMap.get(folder.parent_id) : null;
        
        // Determine main folder and subfolder
        const mainFolderName = parentFolder?.name || folder?.name || 'Uncategorized';
        const subFolderName = folder?.parent_id ? folder.name : null;
        
        // Get or create main folder
        if (!mainFoldersMap.has(mainFolderName)) {
          mainFoldersMap.set(mainFolderName, {
            name: mainFolderName,
            equipment: new Map(),
            subfolders: new Map()
          });
        }
        
        const mainFolder = mainFoldersMap.get(mainFolderName)!;
        
        // Determine where to place the equipment (main folder or subfolder)
        let targetEquipmentMap: Map<string, EquipmentItem>;
        
        if (subFolderName) {
          // Equipment belongs to a subfolder
          if (!mainFolder.subfolders.has(subFolderName)) {
            mainFolder.subfolders.set(subFolderName, {
              name: subFolderName,
              equipment: new Map()
            });
          }
          targetEquipmentMap = mainFolder.subfolders.get(subFolderName)!.equipment;
        } else {
          // Equipment belongs directly to main folder
          targetEquipmentMap = mainFolder.equipment;
        }
        
        // Get or create equipment
        if (!targetEquipmentMap.has(equipmentId)) {
          targetEquipmentMap.set(equipmentId, {
            id: equipmentId,
            name: equipmentName,
            stock,
            bookings: new Map()
          });
        }
        
        const equipment = targetEquipmentMap.get(equipmentId)!;
        
        // Get or create date booking for equipment
        if (!equipment.bookings.has(date)) {
          equipment.bookings.set(date, {
            equipment_id: equipmentId,
            equipment_name: equipmentName,
            stock,
            date,
            folder_name: folder?.name || 'Uncategorized',
            parent_folder_name: parentFolder?.name,
            bookings: [],
            total_used: 0,
            is_overbooked: false
          });
        }
        
        const dateBooking = equipment.bookings.get(date)!;
        dateBooking.bookings.push({
          quantity: booking.quantity || 0,
          project_name: booking.project_events.project.name,
          event_name: booking.project_events.name
        });
        dateBooking.total_used += booking.quantity || 0;
        dateBooking.is_overbooked = dateBooking.total_used > stock;
      });

      return mainFoldersMap;
    }
  });

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newPeriod = isMonthView
      ? addMonths(currentPeriod, direction === 'next' ? 1 : -1)
      : addDays(currentPeriod, direction === 'next' ? 7 : -7);
    setCurrentPeriod(newPeriod);
  };

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

  const getBookingsForEquipment = (equipmentId: string, date: Date, mainFolderName: string, subFolderName?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const mainFolder = mainFolders?.get(mainFolderName);
    
    let equipment: EquipmentItem | undefined;
    if (subFolderName) {
      equipment = mainFolder?.subfolders.get(subFolderName)?.equipment.get(equipmentId);
    } else {
      equipment = mainFolder?.equipment.get(equipmentId);
    }
    
    return equipment?.bookings.get(dateStr);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Equipment Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {isMonthView 
                ? format(currentPeriod, 'MMMM yyyy')
                : `${format(periodStart, 'MMM d')} - ${format(periodEnd, 'MMM d, yyyy')}`
              }
            </span>
            <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!mainFolders || mainFolders.size === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No equipment bookings found for this week
          </div>
        ) : isMonthView ? (
          <div className="space-y-6">
            {/* Month View: Timeline Grid */}
            
            {/* Timeline Container with Background */}
            <div className="relative border border-border rounded-lg overflow-hidden bg-background">
              {/* Weekend Background - Subtle stripes */}
              <div 
                className="absolute inset-0 grid pointer-events-none z-0"
                style={{ 
                  gridTemplateColumns: `260px repeat(${periodDates.length}, 1fr) 70px`
                }}
              >
                <div></div> {/* Equipment column */}
                {periodDates.map(date => (
                  <div 
                    key={`bg-${date.toISOString()}`}
                    className={isWeekend(date) ? 'bg-gradient-to-b from-orange-50 to-orange-100 opacity-40' : ''}
                  />
                ))}
                <div></div> {/* Stock column */}
              </div>
              
              {/* Timeline Header */}
              <div 
                className="relative grid items-center py-3 px-4 bg-muted border-b border-border z-10"
                style={{ 
                  gridTemplateColumns: `260px repeat(${periodDates.length}, 1fr) 70px`
                }}
              >
                <div className="text-sm font-semibold text-foreground">Equipment</div>
                {periodDates.map(date => (
                  <div 
                    key={date.toISOString()} 
                    className={`h-8 flex flex-col items-center justify-center rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isSameDay(date, selectedDate) 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : isWeekend(date)
                        ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                    onClick={() => onDateChange(date)}
                    title={format(date, 'EEEE, MMMM d, yyyy')}
                  >
                    <div className="text-[10px] leading-none">{format(date, 'EEE')[0]}</div>
                    <div className="text-xs font-medium leading-none">{format(date, 'd')}</div>
                  </div>
                ))}
                <div className="text-sm font-semibold text-foreground text-center">Stock</div>
              </div>

              {/* Equipment Folders */}
              <div className="relative z-10 bg-background">
                {Array.from(mainFolders.entries()).map(([mainFolderName, mainFolder]) => (
                  <Collapsible 
                    key={mainFolderName}
                    open={expandedGroups.has(mainFolderName)} 
                    onOpenChange={() => toggleGroup(mainFolderName)}
                    className="border-b border-border last:border-b-0"
                  >
                    {/* Main Folder Header */}
                    <CollapsibleTrigger className="w-full group">
                      <div className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/70 transition-colors">
                        {expandedGroups.has(mainFolderName) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Package className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-sm text-foreground">{mainFolderName}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {mainFolder.equipment.size + Array.from(mainFolder.subfolders.values()).reduce((sum, sub) => sum + sub.equipment.size, 0)} items
                        </Badge>
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      {/* Equipment directly in main folder */}
                      {Array.from(mainFolder.equipment.entries()).map(([equipmentId, equipment]) => (
                        <div 
                          key={equipmentId} 
                          className="grid items-center py-3 px-4 hover:bg-muted/30 transition-colors group/item"
                          style={{ 
                            gridTemplateColumns: `260px repeat(${periodDates.length}, 1fr) 70px`
                          }}
                        >
                          <div className="flex items-center gap-3 pl-8">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-foreground truncate">{equipment.name}</div>
                              <div className="text-xs text-muted-foreground">Stock: {equipment.stock}</div>
                            </div>
                          </div>
                          
                          {periodDates.map(date => {
                            const booking = getBookingsForEquipment(equipmentId, date, mainFolderName);
                            return (
                              <div 
                                key={date.toISOString()} 
                                className={`h-6 mx-1 cursor-pointer transition-all duration-200 relative ${
                                  isSameDay(date, selectedDate) ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                                }`}
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
                            );
                          })}
                          
                          <div className="text-center">
                            <span className="text-sm font-medium text-muted-foreground">
                              {equipment.stock}
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Subfolders */}
                      {Array.from(mainFolder.subfolders.entries()).map(([subFolderName, subFolder]) => (
                        <Collapsible key={subFolderName} defaultOpen={false}>
                          <CollapsibleTrigger className="w-full group/subfolder">
                            <div className="flex items-center gap-3 py-2 px-4 pl-12 bg-muted/50 hover:bg-muted transition-colors border-t border-border">
                              <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">{subFolderName}</span>
                              <Badge variant="outline" className="ml-auto text-xs">
                                {subFolder.equipment.size} items
                              </Badge>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {Array.from(subFolder.equipment.entries()).map(([equipmentId, equipment]) => (
                              <div 
                                key={equipmentId} 
                                className="grid items-center py-3 px-4 hover:bg-muted/30 transition-colors"
                                style={{ 
                                  gridTemplateColumns: `260px repeat(${periodDates.length}, 1fr) 70px`
                                }}
                              >
                                <div className="flex items-center gap-3 pl-16">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-foreground truncate">{equipment.name}</div>
                                    <div className="text-xs text-muted-foreground">Stock: {equipment.stock}</div>
                                  </div>
                                </div>
                                
                                {periodDates.map(date => {
                                  const booking = getBookingsForEquipment(equipmentId, date, mainFolderName, subFolderName);
                                  return (
                                    <div 
                                      key={date.toISOString()} 
                                      className={`h-6 mx-1 cursor-pointer transition-all duration-200 relative ${
                                        isSameDay(date, selectedDate) ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                                      }`}
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
                                  );
                                })}
                                
                                <div className="text-center">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {equipment.stock}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Week View: Header Section */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground mb-1">
                {format(periodStart, 'MMM d')} - {format(periodEnd, 'MMM d, yyyy')} Equipment Schedule
              </h3>
              <p className="text-xs text-muted-foreground">
                Detailed equipment bookings and availability for the week
              </p>
            </div>

            {/* Week Timeline Header */}
            <div className="grid grid-cols-8 gap-3 mb-6 p-4 bg-muted border border-border rounded-lg">
              <div className="font-semibold text-sm text-foreground">Equipment</div>
              {periodDates.map(date => (
                <div 
                  key={date.toISOString()} 
                  className={`text-center p-2 rounded-md transition-colors cursor-pointer ${
                    isSameDay(date, selectedDate) 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : isWeekend(date)
                      ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => onDateChange(date)}
                >
                  <div className="text-sm font-medium">{format(date, 'EEE')}</div>
                  <div className="text-xs opacity-80">{format(date, 'MMM d')}</div>
                </div>
              ))}
            </div>

            {/* Equipment Folders */}
            {Array.from(mainFolders.entries()).map(([mainFolderName, mainFolder]) => (
              <div key={mainFolderName} className="border border-border rounded-lg overflow-hidden bg-background">
                {/* Main Folder Header */}
                <Collapsible 
                  open={expandedGroups.has(mainFolderName)} 
                  onOpenChange={() => toggleGroup(mainFolderName)}
                >
                  <CollapsibleTrigger className="w-full group">
                    <div className="flex items-center gap-3 p-4 bg-muted hover:bg-muted/70 transition-colors">
                      {expandedGroups.has(mainFolderName) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Package className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-sm text-foreground">{mainFolderName}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {mainFolder.equipment.size + Array.from(mainFolder.subfolders.values()).reduce((sum, sub) => sum + sub.equipment.size, 0)} items
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    {/* Equipment directly in main folder */}
                    {Array.from(mainFolder.equipment.entries()).map(([equipmentId, equipment]) => (
                      <div key={equipmentId} className="grid grid-cols-8 gap-3 py-4 px-4 border-b border-border hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 pl-8">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground truncate">{equipment.name}</div>
                            <div className="text-xs text-muted-foreground">Stock: {equipment.stock}</div>
                          </div>
                        </div>
                        
                        {periodDates.map(date => {
                          const booking = getBookingsForEquipment(equipmentId, date, mainFolderName);
                          return (
                            <div 
                              key={date.toISOString()} 
                              className={cn(
                                "p-2 rounded-md min-h-[70px] cursor-pointer transition-all duration-200 border",
                                isSameDay(date, selectedDate) 
                                  ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-400' 
                                  : isWeekend(date)
                                  ? 'bg-orange-50 border-orange-100 hover:bg-orange-100'
                                  : 'bg-background border-border hover:bg-muted/20'
                              )}
                              onClick={() => onDateChange(date)}
                            >
                              {booking ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1">
                                    <Badge 
                                      variant={booking.is_overbooked ? "destructive" : "default"}
                                      className="text-xs"
                                      className={booking.is_overbooked ? "" : "bg-green-500 text-white"}
                                    >
                                      {booking.is_overbooked && <AlertTriangle className="h-3 w-3 mr-1" />}
                                      {booking.total_used}/{equipment.stock}
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    {booking.bookings.slice(0, 2).map((b, i) => (
                                      <div key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate font-medium">
                                        {b.quantity}x {b.project_name}
                                      </div>
                                    ))}
                                    {booking.bookings.length > 2 && (
                                      <div className="text-xs text-muted-foreground text-center">
                                        +{booking.bookings.length - 2} more bookings
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-xs text-muted-foreground text-center">
                                    Available
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    
                    {/* Subfolders */}
                    {Array.from(mainFolder.subfolders.entries()).map(([subFolderName, subFolder]) => (
                      <Collapsible key={subFolderName} defaultOpen={false}>
                        <CollapsibleTrigger className="w-full group/subfolder">
                          <div className="flex items-center gap-3 py-3 px-4 pl-12 bg-muted/50 hover:bg-muted transition-colors border-t border-border">
                            <ChevronRightIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">{subFolderName}</span>
                            <Badge variant="outline" className="ml-auto text-xs">
                              {subFolder.equipment.size} items
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {Array.from(subFolder.equipment.entries()).map(([equipmentId, equipment]) => (
                            <div key={equipmentId} className="grid grid-cols-8 gap-3 py-4 px-4 border-b border-border hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3 pl-16">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-foreground truncate">{equipment.name}</div>
                                  <div className="text-xs text-muted-foreground">Stock: {equipment.stock}</div>
                                </div>
                              </div>
                              
                              {periodDates.map(date => {
                                const booking = getBookingsForEquipment(equipmentId, date, mainFolderName, subFolderName);
                                return (
                                  <div 
                                    key={date.toISOString()} 
                                    className={cn(
                                      "p-2 rounded-md min-h-[70px] cursor-pointer transition-all duration-200 border",
                                      isSameDay(date, selectedDate) 
                                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-400' 
                                        : isWeekend(date)
                                        ? 'bg-orange-50 border-orange-100 hover:bg-orange-100'
                                        : 'bg-background border-border hover:bg-muted/20'
                                    )}
                                    onClick={() => onDateChange(date)}
                                  >
                                    {booking ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-1">
                                          <Badge 
                                            variant={booking.is_overbooked ? "destructive" : "default"}
                                            className="text-xs"
                                            style={{
                                              backgroundColor: booking.is_overbooked ? undefined : '#22c55e',
                                              color: booking.is_overbooked ? undefined : 'white'
                                            }}
                                          >
                                            {booking.is_overbooked && <AlertTriangle className="h-3 w-3 mr-1" />}
                                            {booking.total_used}/{equipment.stock}
                                          </Badge>
                                        </div>
                                        <div className="space-y-1">
                                          {booking.bookings.slice(0, 2).map((b, i) => (
                                            <div key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate font-medium">
                                              {b.quantity}x {b.project_name}
                                            </div>
                                          ))}
                                          {booking.bookings.length > 2 && (
                                            <div className="text-xs text-muted-foreground text-center">
                                              +{booking.bookings.length - 2} more bookings
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center h-full">
                                        <div className="text-xs text-muted-foreground text-center">
                                          Available
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}