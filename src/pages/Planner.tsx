import { useState } from "react";
import { Calendar, Package, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentCalendar } from "@/components/planner/EquipmentCalendar";
import { CrewCalendar } from "@/components/planner/CrewCalendar";
import { PlannerFilters } from "@/components/planner/PlannerFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<'month' | 'week'>('month');
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'equipment' | 'crew'>('equipment');

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Calendar className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Planner</h1>
            <p className="text-muted-foreground">
              Global resource availability and scheduling across all projects
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <PlannerFilters
            selectedOwner={selectedOwner}
            onOwnerChange={setSelectedOwner}
            activeTab={activeTab}
          />
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={selectedView === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('month')}
            >
              Month
            </Button>
            <Button
              variant={selectedView === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedView('week')}
            >
              Week
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="equipment" className="space-y-6" onValueChange={(value) => setActiveTab(value as 'equipment' | 'crew')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Equipment Planner
          </TabsTrigger>
          <TabsTrigger value="crew" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Crew Planner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          <EquipmentCalendar 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate}
            selectedOwner={selectedOwner}
            viewMode={selectedView}
          />
        </TabsContent>

        <TabsContent value="crew" className="space-y-6">
          <CrewCalendar 
            selectedDate={selectedDate} 
            onDateChange={setSelectedDate}
            selectedOwner={selectedOwner}
            viewMode={selectedView}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Equipment Utilization</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
              </div>
              <div className="text-right">
                {equipmentStats ? (
                  <>
                    <p className="text-lg font-bold text-green-500">{equipmentStats.utilization}%</p>
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
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Crew Assignments</p>
                  <p className="text-xs text-muted-foreground">Active roles today</p>
                </div>
              </div>
              <div className="text-right">
                {crewStats !== undefined ? (
                  <p className="text-lg font-bold text-orange-500">{crewStats}</p>
                ) : (
                  <Skeleton className="h-8 w-8" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Upcoming Events</p>
                  <p className="text-xs text-muted-foreground">Next 7 days</p>
                </div>
              </div>
              <div className="text-right">
                {upcomingEvents !== undefined ? (
                  <p className="text-lg font-bold text-blue-500">{upcomingEvents}</p>
                ) : (
                  <Skeleton className="h-8 w-8" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Planner;