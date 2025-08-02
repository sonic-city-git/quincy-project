import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, ChevronLeft, ChevronRight, User } from "lucide-react";
import { format, addDays, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isSameMonth, getDaysInMonth, isWeekend } from "date-fns";

interface CrewAssignment {
  crew_member_id: string | null;
  crew_member_name: string | null;
  crew_member_avatar: string | null;
  role_name: string;
  role_color: string;
  date: string;
  project_name: string;
  event_name: string;
  daily_rate?: number;
}

interface CrewCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOwner?: string;
  viewMode?: 'week' | 'month';
}

export function CrewCalendar({ selectedDate, onDateChange, selectedOwner, viewMode = 'week' }: CrewCalendarProps) {
  const [currentPeriod, setCurrentPeriod] = useState(selectedDate);
  
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

  const { data: crewAssignments, isLoading } = useQuery({
    queryKey: ['crew-planner', format(periodStart, 'yyyy-MM-dd'), format(periodEnd, 'yyyy-MM-dd'), selectedOwner, viewMode],
    queryFn: async () => {
      // Get all crew assignments for the period
      let query = supabase
        .from('project_event_roles')
        .select(`
          crew_member_id,
          daily_rate,
          crew_member:crew_members (
            name,
            avatar_url
          ),
          role:crew_roles!inner (
            name,
            color
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
        .lte('project_events.date', format(periodEnd, 'yyyy-MM-dd'));

      if (selectedOwner) {
        query = query.eq('project_events.project.owner_id', selectedOwner);
      }

      const { data: assignments, error } = await query;
      if (error) throw error;

      // Map to our interface
      return assignments?.map(assignment => ({
        crew_member_id: assignment.crew_member_id,
        crew_member_name: assignment.crew_member?.name || null,
        crew_member_avatar: assignment.crew_member?.avatar_url || null,
        role_name: assignment.role.name,
        role_color: assignment.role.color,
        date: assignment.project_events.date,
        project_name: assignment.project_events.project.name,
        event_name: assignment.project_events.name,
        daily_rate: assignment.daily_rate
      })) || [];
    }
  });

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newPeriod = isMonthView
      ? addMonths(currentPeriod, direction === 'next' ? 1 : -1)
      : addDays(currentPeriod, direction === 'next' ? 7 : -7);
    setCurrentPeriod(newPeriod);
  };

  const getAssignmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return crewAssignments?.filter(assignment => assignment.date === dateStr) || [];
  };

  const getUniqueCrewMembers = () => {
    if (!crewAssignments) return [];
    const crewMap = new Map();
    
    crewAssignments.forEach(assignment => {
      if (assignment.crew_member_id && !crewMap.has(assignment.crew_member_id)) {
        crewMap.set(assignment.crew_member_id, {
          id: assignment.crew_member_id,
          name: assignment.crew_member_name,
          avatar: assignment.crew_member_avatar
        });
      }
    });
    
    return Array.from(crewMap.values());
  };

  const getCrewAssignmentsForDate = (crewMemberId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return crewAssignments?.filter(
      assignment => assignment.crew_member_id === crewMemberId && assignment.date === dateStr
    ) || [];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crew Calendar
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

  const uniqueCrewMembers = getUniqueCrewMembers();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Crew Calendar
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
        {uniqueCrewMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No crew assignments found for this week
          </div>
        ) : isMonthView ? (
          <div className="space-y-2">
            {/* Month View: Timeline Grid */}
            <div className="text-xs text-muted-foreground mb-2">
              {format(currentPeriod, 'MMMM yyyy')} - Crew Timeline
            </div>
            
            {uniqueCrewMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No crew assignments found for this month
              </div>
            ) : (
              <div className="space-y-2">
                {/* Month Header - Grid Structure */}
                <div 
                  className="grid gap-px text-center mb-3 bg-muted p-2 rounded"
                  style={{ 
                    gridTemplateColumns: `200px repeat(${periodDates.length}, 1fr) 60px`
                  }}
                >
                  <div className="text-sm font-medium text-left pl-2">Crew Member</div>
                  {periodDates.map(date => (
                    <div 
                      key={date.toISOString()} 
                      className={`h-6 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                        isSameDay(date, selectedDate) 
                          ? 'bg-blue-500 text-white font-bold' 
                          : isWeekend(date)
                          ? 'bg-orange-100 text-orange-700 font-semibold'
                          : 'text-muted-foreground hover:bg-muted-foreground/10'
                      }`}
                      title={format(date, 'EEEE, MMMM d, yyyy')}
                      style={{ fontSize: '10px' }}
                    >
                      {format(date, 'd')}
                    </div>
                  ))}
                  <div className="text-xs font-medium text-right pr-1">Days</div>
                </div>

                {/* Crew Timeline Rows */}
                {uniqueCrewMembers.map(crewMember => (
                  <div 
                    key={crewMember.id} 
                    className="grid gap-px items-center border-b border-border/30 py-2 hover:bg-muted/10"
                    style={{ 
                      gridTemplateColumns: `200px repeat(${periodDates.length}, 1fr) 60px`
                    }}
                  >
                    <div className="flex items-center gap-2 pl-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={crewMember.avatar} />
                        <AvatarFallback className="text-xs">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium truncate">{crewMember.name}</div>
                    </div>
                    
                    {periodDates.map(date => {
                      const assignments = getCrewAssignmentsForDate(crewMember.id, date);
                      const isWeekendDay = isWeekend(date);
                      return (
                        <div 
                          key={date.toISOString()} 
                          className={`h-5 cursor-pointer transition-colors relative ${
                            isSameDay(date, selectedDate) ? 'ring-1 ring-blue-400' : ''
                          } ${isWeekendDay ? 'opacity-75' : ''}`}
                          onClick={() => onDateChange(date)}
                          title={assignments.length > 0 ? 
                            `${crewMember.name} - ${assignments.map(a => a.role_name).join(', ')}` : 
                            `${crewMember.name} - Available`
                          }
                        >
                          {assignments.length > 0 ? (
                            <div 
                              className={`h-full w-full rounded-sm border ${
                                isWeekendDay ? 'border-orange-200' : 'border-transparent'
                              }`}
                              style={{ 
                                backgroundColor: assignments[0].role_color,
                                opacity: assignments.length > 1 ? 0.9 : 0.7
                              }}
                            >
                              {assignments.length > 1 && (
                                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-white rounded-full" />
                              )}
                            </div>
                          ) : (
                            <div className={`h-full w-full rounded-sm transition-colors ${
                              isWeekendDay 
                                ? 'bg-orange-50 hover:bg-orange-100 border border-orange-200' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`} />
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">
                        {periodDates.reduce((count, date) => {
                          const assignments = getCrewAssignmentsForDate(crewMember.id, date);
                          return count + assignments.length;
                        }, 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Week View: Header Row */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="font-medium text-sm">Crew Member</div>
              {periodDates.map(date => (
                <div 
                  key={date.toISOString()} 
                  className={`text-center text-sm font-medium p-2 rounded ${
                    isSameDay(date, selectedDate) ? 'bg-blue-100 text-blue-700' : ''
                  }`}
                >
                  <div>{format(date, 'EEE')}</div>
                  <div className="text-xs opacity-70">{format(date, 'MMM d')}</div>
                </div>
              ))}
            </div>

            {/* Week View: Crew Member Rows */}
            {uniqueCrewMembers.map(crewMember => (
              <div key={crewMember.id} className="grid grid-cols-8 gap-2 py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={crewMember.avatar} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{crewMember.name}</div>
                  </div>
                </div>
                
                {periodDates.map(date => {
                  const assignments = getCrewAssignmentsForDate(crewMember.id, date);
                  return (
                    <div 
                      key={date.toISOString()} 
                      className={`p-1 rounded min-h-[60px] cursor-pointer transition-colors ${
                        isSameDay(date, selectedDate) ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => onDateChange(date)}
                    >
                      {assignments.length > 0 ? (
                        <div className="space-y-1">
                          {assignments.slice(0, 2).map((assignment, i) => (
                            <div key={i} className="space-y-0.5">
                              <Badge 
                                variant="secondary"
                                className="text-xs w-full justify-start"
                                style={{ backgroundColor: `${assignment.role_color}20`, color: assignment.role_color }}
                              >
                                {assignment.role_name}
                              </Badge>
                              <div className="text-xs text-muted-foreground truncate">
                                {assignment.project_name}
                              </div>
                            </div>
                          ))}
                          {assignments.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{assignments.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          Available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Unassigned Roles Section - Only show in week view */}
            {!isMonthView && (
              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Unassigned Roles
                </h4>
                <div className="grid grid-cols-8 gap-2">
                  <div className="text-sm text-muted-foreground">Open Positions</div>
                  {periodDates.map(date => {
                    const dateAssignments = getAssignmentsForDate(date);
                    const unassignedCount = dateAssignments.filter(a => !a.crew_member_id).length;
                    
                    return (
                      <div 
                        key={date.toISOString()} 
                        className={`p-2 rounded text-center cursor-pointer transition-colors ${
                          isSameDay(date, selectedDate) ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => onDateChange(date)}
                      >
                        {unassignedCount > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {unassignedCount} open
                          </Badge>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            All filled
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}