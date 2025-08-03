import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { UnifiedCalendar } from "@/components/planner/UnifiedCalendar";
import { useSharedTimeline } from "@/components/planner/shared/hooks/useSharedTimeline";
import { TimelineHeader, PlannerFilters } from "@/components/planner/shared/components/TimelineHeader";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Planner = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // On page refresh, always start with today selected
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);
  
  // Initialize activeTab from localStorage, fallback to 'equipment'
  const [activeTab, setActiveTab] = useState<'equipment' | 'crew'>(() => {
    try {
      const savedTab = localStorage.getItem('planner-active-tab');
      return (savedTab === 'crew' || savedTab === 'equipment') ? savedTab : 'equipment';
    } catch {
      return 'equipment';
    }
  });

  // Persist activeTab and selectedDate to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('planner-active-tab', activeTab);
      localStorage.setItem('planner-selected-date', selectedDate.toISOString());
    } catch (error) {
      // Silently handle localStorage errors (e.g., when in private mode)
      console.warn('Could not save preferences to localStorage:', error);
    }
  }, [activeTab, selectedDate]);
  
  // Filter state
  const [filters, setFilters] = useState<PlannerFilters>({
    search: '',
    selectedOwner: '',
    equipmentType: '',
    crewRole: ''
  });

  // Separate state for problems-only mode
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);

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
          showProblemsOnly={showProblemsOnly}
          onToggleProblemsOnly={() => setShowProblemsOnly(!showProblemsOnly)}
        />
        
        {/* Calendar Content */}
        <UnifiedCalendar 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate}
          selectedOwner={filters.selectedOwner}
          sharedTimeline={sharedTimeline}
          resourceType={activeTab}
          filters={filters}
          showProblemsOnly={showProblemsOnly}
        />
      </div>


    </div>
  );
};

export default Planner;