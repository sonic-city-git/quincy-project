import { useState, useEffect } from "react";
import { Calendar, Package, Users, Filter, AlertTriangle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UnifiedCalendar } from "@/components/planner/UnifiedCalendar";
import { useSharedTimeline } from "@/components/planner/shared/hooks/useSharedTimeline";
import { TimelineHeader, PlannerFilters } from "@/components/planner/shared/components/TimelineHeader";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Initialize activeTab from localStorage, fallback to 'equipment'
  const [activeTab, setActiveTab] = useState<'equipment' | 'crew'>(() => {
    try {
      const savedTab = localStorage.getItem('planner-active-tab');
      return (savedTab === 'crew' || savedTab === 'equipment') ? savedTab : 'equipment';
    } catch {
      return 'equipment';
    }
  });

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('planner-active-tab', activeTab);
    } catch (error) {
      // Silently handle localStorage errors (e.g., when in private mode)
      console.warn('Could not save tab preference to localStorage:', error);
    }
  }, [activeTab]);
  
  // Filter state
  const [filters, setFilters] = useState<PlannerFilters>({
    search: '',
    selectedOwner: '',
    equipmentType: '',
    crewRole: ''
  });

  // Shared timeline state for both planners
  const sharedTimeline = useSharedTimeline({ selectedDate });

  // Get owners for filtering
  const { data: owners } = useQuery({
    queryKey: ['project-owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          owner_id,
          owner:crew_members!projects_owner_id_fkey (
            id,
            name,
            email
          )
        `)
        .not('owner_id', 'is', null);
      
      if (error) throw error;
      
      // Get unique owners
      const ownerMap = new Map();
      data?.forEach(project => {
        if (project.owner_id && !ownerMap.has(project.owner_id)) {
          ownerMap.set(project.owner_id, {
            id: project.owner_id,
            name: project.owner?.name || 'Unknown',
            email: project.owner?.email
          });
        }
      });
      
      return Array.from(ownerMap.values());
    }
  });

  // Stats queries
  const today = format(new Date(), 'yyyy-MM-dd');
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  // Equipment utilization query
  const { data: equipmentStats } = useQuery({
    queryKey: ['equipment-stats', today],
    queryFn: async () => {
      // Get total equipment and equipment in use today
      const [totalResult, inUseResult] = await Promise.all([
        supabase.from('equipment').select('id').then(res => res.data?.length || 0),
        supabase
          .from('project_event_equipment')
          .select(`
            equipment_id,
            project_events!inner (
              date
            )
          `)
          .eq('project_events.date', today)
          .then(res => {
            const uniqueEquipment = new Set(res.data?.map(item => item.equipment_id) || []);
            return uniqueEquipment.size;
          })
      ]);

      const utilization = totalResult > 0 ? Math.round((inUseResult / totalResult) * 100) : 0;
      return { total: totalResult, inUse: inUseResult, utilization };
    }
  });

  // Crew assignments query
  const { data: crewStats } = useQuery({
    queryKey: ['crew-stats', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_event_roles')
        .select(`
          id,
          project_events!inner (
            date
          )
        `)
        .eq('project_events.date', today);

      if (error) throw error;
      return data?.length || 0;
    }
  });

  // Upcoming events query
  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events', today, nextWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_events')
        .select('id')
        .gte('date', today)
        .lte('date', nextWeek);

      if (error) throw error;
      return data?.length || 0;
    }
  });

  return (
    <div className="container max-w-[1600px] p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Calendar className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Planner</h1>
          <p className="text-muted-foreground">
            Global resource availability and scheduling across all projects
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Timeline Header - Outside calendar for better performance */}
        <TimelineHeader
          formattedDates={sharedTimeline.formattedDates}
          monthSections={sharedTimeline.monthSections}
          onDateChange={setSelectedDate}
          onHeaderScroll={(e) => {
            // Sync with timeline content scroll
            if (sharedTimeline.equipmentRowsRef.current) {
              sharedTimeline.equipmentRowsRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          stickyHeadersRef={sharedTimeline.stickyHeadersRef}
          resourceType={activeTab}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filters={filters}
          onFiltersChange={setFilters}
        />
        
        {/* Calendar Content */}
        <UnifiedCalendar 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate}
          selectedOwner={filters.selectedOwner}
          sharedTimeline={sharedTimeline}
          resourceType={activeTab}
          filters={filters}
        />
      </div>

      {/* Tab-Specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {activeTab === 'equipment' ? (
          <>
            <Card className="border-green-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Equipment Utilization</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {equipmentStats ? (
                      <>
                        <p className="text-lg font-bold text-green-600">{equipmentStats.utilization}%</p>
                        <p className="text-xs text-muted-foreground">
                          {equipmentStats.inUse}/{equipmentStats.total} items
                        </p>
                      </>
                    ) : (
                      <Skeleton className="h-8 w-12" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Equipment Conflicts</p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-500">0</p>
                    <p className="text-xs text-muted-foreground">No conflicts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-green-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Equipment Categories</p>
                      <p className="text-xs text-muted-foreground">Total active</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">8</p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border-orange-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Active Crew</p>
                      <p className="text-xs text-muted-foreground">Today</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {crewStats !== undefined ? (
                      <>
                        <p className="text-lg font-bold text-orange-600">{crewStats}</p>
                        <p className="text-xs text-muted-foreground">Assignments</p>
                      </>
                    ) : (
                      <Skeleton className="h-8 w-8" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium">Unassigned Roles</p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-500">3</p>
                    <p className="text-xs text-muted-foreground">Open positions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-orange-200/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Crew Utilization</p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600">75%</p>
                    <p className="text-xs text-muted-foreground">Average</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Planner;