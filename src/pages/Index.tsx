import { useState, useEffect, useMemo } from "react";
import { LayoutDashboard, TrendingUp, AlertTriangle, Calendar, CalendarDays } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DashboardHeader, DashboardFilters } from "@/components/dashboard/DashboardHeader";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { GlobalSearchResults } from "@/components/dashboard/GlobalSearchResults";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { formatPrice } from "@/utils/priceFormatters";
import { useAuth } from "@/components/AuthProvider";
import { useProjects } from "@/hooks/useProjects";

const Index = () => {
  const { session } = useAuth();
  
  // Initialize activeTab: 'all' on browser refresh, saved preference on app navigation
  const [activeTab, setActiveTab] = useState<'me' | 'all'>(() => {
    try {
      // Check if this was app navigation (double-ESC, sidebar, etc.)
      const isAppNavigation = sessionStorage.getItem('dashboard-app-navigation') === 'true';
      
      if (isAppNavigation) {
        // App navigation: restore user's last choice
        sessionStorage.removeItem('dashboard-app-navigation'); // Clean up flag
        const saved = localStorage.getItem('dashboard-active-tab');
        return (saved as 'me' | 'all') || 'all';
      } else {
        // Browser refresh or direct URL: always default to 'all' tab
        return 'all';
      }
    } catch {
      // Fallback to 'all' 
      return 'all';
    }
  });
  
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
    owner: ''
  });

  // Handle scroll reset on browser refresh
  useEffect(() => {
    // Check if this was app navigation vs browser refresh
    const isAppNavigation = sessionStorage.getItem('dashboard-app-navigation') === 'true';
    
    if (!isAppNavigation) {
      // Browser refresh: scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []); // Run only on mount

  // Save tab preference to localStorage 
  useEffect(() => {
    try {
      localStorage.setItem('dashboard-active-tab', activeTab);
    } catch (error) {
      console.warn('Could not save preferences to localStorage:', error);
    }
  }, [activeTab]);

  // Get projects data for owner name -> ID conversion
  const { projects } = useProjects();

  // Global search hook
  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(filters.search);

  // Determine selectedOwnerId based on activeTab and filters
  const selectedOwnerId = useMemo(() => {
    if (activeTab === 'me') {
      return session?.user?.id || null;
    }
    
    // For "All" tab with owner filter, convert owner name to ID
    if (filters.owner && filters.owner !== 'all') {
      const ownerProject = projects?.find(project => 
        project.owner?.name === filters.owner
      );
      return ownerProject?.owner?.id || null;
    }
    
    // No filter selected
    return null;
  }, [activeTab, session?.user?.id, filters.owner, projects]);

  // Key metrics queries - filtered by owner
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', selectedOwnerId],
    queryFn: async () => {
      // Active projects query with proper database filtering
      let projectsQuery = supabase
        .from('projects')
        .select('id')
        .eq('is_archived', false);
      
      if (selectedOwnerId) {
        projectsQuery = projectsQuery.eq('owner_id', selectedOwnerId);
      }
      
      // Events this week query with proper database filtering
      let eventsQuery = supabase
        .from('project_events')
        .select('id, project:projects!inner(owner_id)')
        .gte('date', new Date().toISOString().split('T')[0])
        .lte('date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      
      if (selectedOwnerId) {
        eventsQuery = eventsQuery.eq('project.owner_id', selectedOwnerId);
      }
      
      const [projectsResult, eventsResult] = await Promise.all([
        projectsQuery,
        eventsQuery
      ]);
      
      if (projectsResult.error) throw projectsResult.error;
      if (eventsResult.error) throw eventsResult.error;
      
      
      
      return {
        activeProjects: projectsResult.data?.length || 0,
        upcomingEvents: eventsResult.data?.length || 0
      };
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

        {/* Operational Status - Global View (Always Visible) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Operational Status</h3>
          </div>
          <DashboardStatsCards selectedOwnerId={null} />
        </div>

        {/* Conditional Content - Search Results vs Dashboard */}
        {filters.search && filters.search.length >= 2 ? (
          /* Search Results Mode */
          <Card className="border-0 shadow-md bg-zinc-900/50">
            <CardContent className="p-6">
              <GlobalSearchResults 
                results={searchResults || { projects: [], crew: [], equipment: [], total: 0 }}
                isLoading={isSearching}
                query={filters.search}
              />
            </CardContent>
          </Card>
        ) : (
          /* Normal Dashboard Mode */
          <>
            {/* Key Metrics Row - Essential Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="text-sm font-medium text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold">{stats?.upcomingEvents || 0}</p>
                      <p className="text-xs text-muted-foreground">events</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart - Full Width */}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Index;