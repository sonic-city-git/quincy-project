import { useState, useEffect } from "react";
import { LayoutDashboard, TrendingUp, AlertTriangle, Calendar, Users, Package, Plus, Eye, CalendarDays, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { EquipmentConflicts } from "@/components/dashboard/EquipmentConflicts";
import { EmptyCrewRoles } from "@/components/dashboard/EmptyCrewRoles";
import { DashboardHeader, DashboardFilters } from "@/components/dashboard/DashboardHeader";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { formatPrice } from "@/utils/priceFormatters";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { useAuth } from "@/components/AuthProvider";

const Index = () => {
  const { session } = useAuth();
  
  // Initialize activeTab from localStorage, fallback to 'me'
  const [activeTab, setActiveTab] = useState<'me' | 'all'>(() => {
    try {
      const saved = localStorage.getItem('dashboard-active-tab');
      return (saved as 'me' | 'all') || 'me';
    } catch {
      return 'me';
    }
  });
  
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
    owner: ''
  });

  // Save tab preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dashboard-active-tab', activeTab);
    } catch (error) {
      console.warn('Could not save preferences to localStorage:', error);
    }
  }, [activeTab]);

  // Determine selectedOwnerId based on activeTab and filters
  const selectedOwnerId = activeTab === 'me' 
    ? session?.user?.id || '' 
    : filters.owner;

  // Key metrics queries
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', selectedOwnerId],
    queryFn: async () => {
      const queries = [
        // Active projects (not archived)
        supabase
          .from('projects')
          .select('id, owner_id, is_archived')
          .eq('is_archived', false)
          .then(({ data, error }) => {
            if (error) throw error;
            return selectedOwnerId ? data?.filter(p => p.owner_id === selectedOwnerId).length || 0 : data?.length || 0;
          }),
        
        // Total crew members
        supabase
          .from('crew_members')
          .select('id')
          .then(({ data, error }) => {
            if (error) throw error;
            return data?.length || 0;
          }),
        
        // Total equipment items
        supabase
          .from('equipment')
          .select('id')
          .then(({ data, error }) => {
            if (error) throw error;
            return data?.length || 0;
          }),
        
        // Upcoming events this week
        supabase
          .from('project_events')
          .select('id, project:projects!inner(owner_id)')
          .gte('date', new Date().toISOString().split('T')[0])
          .lte('date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .then(({ data, error }) => {
            if (error) throw error;
            return selectedOwnerId ? data?.filter(e => e.project?.owner_id === selectedOwnerId).length || 0 : data?.length || 0;
          })
      ];
      
      const [activeProjects, totalCrew, totalEquipment, upcomingEvents] = await Promise.all(queries);
      
      return {
        activeProjects,
        totalCrew,
        totalEquipment,
        upcomingEvents
      };
    }
  });

  // Recent activity query
  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard-activity', selectedOwnerId],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          is_archived,
          created_at,
          owner_id,
          project_type:project_types(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (selectedOwnerId) {
        query = query.eq('owner_id', selectedOwnerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="container max-w-[1600px] p-8">
      {/* Header - Following established pattern */}
      <div className="flex items-center gap-4 mb-8">
        <LayoutDashboard className="h-8 w-8 text-blue-500" />
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Production overview and operational insights across all projects
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Dashboard Header with Tab Switching and Filters */}
        <DashboardHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Key Metrics Row - Simple Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-md bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-bold">{stats?.activeProjects || 0}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Crew Members</p>
                  <p className="text-2xl font-bold">{stats?.totalCrew || 0}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Equipment Items</p>
                  <p className="text-2xl font-bold">{stats?.totalEquipment || 0}</p>
                </div>
                <Package className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-zinc-900/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats?.upcomingEvents || 0}</p>
                  <p className="text-xs text-muted-foreground">events</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Row */}
        <Card className="border-0 shadow-md bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button asChild className="h-auto p-4 flex-col gap-2">
                <Link to="/projects">
                  <CalendarDays className="h-6 w-6" />
                  <span className="text-sm">New Project</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link to="/resources?tab=crew">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Add Crew</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link to="/resources?tab=equipment">
                  <Package className="h-6 w-6" />
                  <span className="text-sm">Add Equipment</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col gap-2">
                <Link to="/planner">
                  <Eye className="h-6 w-6" />
                  <span className="text-sm">View Planner</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart - Takes up more space */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart ownerId={selectedOwnerId} />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-0 shadow-md bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Recent Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity?.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDisplayDate(new Date(project.created_at))}
                      </p>
                    </div>
                    <Badge variant={!project.is_archived ? 'default' : 'secondary'} className="ml-2">
                      {project.is_archived ? 'archived' : 'active'}
                    </Badge>
                  </div>
                ))}
                {(!recentActivity || recentActivity.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent projects
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Stats Grid - From Resources & Planner Pages */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Operational Metrics</h3>
          </div>
          <DashboardStatsCards selectedOwnerId={selectedOwnerId} />
        </div>

        {/* Alerts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Equipment Conflicts */}
          <Card className="border-0 shadow-md bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Equipment Conflicts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EquipmentConflicts ownerId={selectedOwnerId} />
            </CardContent>
          </Card>

          {/* Empty Crew Roles */}
          <Card className="border-0 shadow-md bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Empty Crew Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyCrewRoles ownerId={selectedOwnerId} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Stats Grid - Following established pattern */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Link to="/projects" className="block">
          <Card className="border-0 shadow-md bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-semibold">Projects</p>
                  <p className="text-sm text-muted-foreground">Manage productions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/planner" className="block">
          <Card className="border-0 shadow-md bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-semibold">Planner</p>
                  <p className="text-sm text-muted-foreground">Resource scheduling</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/resources" className="block">
          <Card className="border-0 shadow-md bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="font-semibold">Resources</p>
                  <p className="text-sm text-muted-foreground">Crew & equipment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Index;