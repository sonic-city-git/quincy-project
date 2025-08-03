import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useOwnerOptions } from "@/hooks/useOwnerOptions";
import { useProjects } from "@/hooks/useProjects";
import { useFilterState } from "@/hooks/useFilterState";
import { UnifiedCalendar } from "@/components/planner/UnifiedCalendar";
import { useSharedTimeline } from "@/components/planner/shared/hooks/useSharedTimeline";
import { TimelineHeader, PlannerFilters } from "@/components/planner/shared/components/TimelineHeader";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Planner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // On page refresh, always start with today selected
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);
  
  // Use consolidated tab persistence hook
  const [activeTab, setActiveTab] = useTabPersistence(
    'planner-active-tab',
    'equipment',
    ['equipment', 'crew'] as const
  );

  // Persist selectedDate to localStorage (activeTab is handled by useTabPersistence hook)
  useEffect(() => {
    try {
      localStorage.setItem('planner-selected-date', selectedDate.toISOString());
    } catch (error) {
      // Silently handle localStorage errors (e.g., when in private mode)
      console.warn('Could not save preferences to localStorage:', error);
    }
  }, [selectedDate]);
  
  // Filter state
  const [filters, setFilters, updateFilters, clearFilters] = useFilterState<PlannerFilters>({
    search: '',
    selectedOwner: '',
    equipmentType: '',
    crewRole: ''
  });

  // Handle URL parameters for direct navigation to specific equipment/crew
  useEffect(() => {
    const equipmentId = searchParams.get('equipment');
    const crewId = searchParams.get('crew');
    const projectId = searchParams.get('project');

    if (equipmentId) {
      // Switch to equipment tab and set target for scrolling
      setActiveTab('equipment');
      setTargetScrollItem({ type: 'equipment', id: equipmentId });
      
      // Clear URL parameter
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('equipment');
      setSearchParams(newParams, { replace: true });
    } else if (crewId) {
      // Switch to crew tab and set target for scrolling
      setActiveTab('crew');
      setTargetScrollItem({ type: 'crew', id: crewId });
      
      // Clear URL parameter
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('crew');
      setSearchParams(newParams, { replace: true });
    } else if (projectId) {
      // For projects, we can filter by project owner or name
      // This is more complex and might need additional implementation
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('project');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // State to track target item for scrolling
  const [targetScrollItem, setTargetScrollItem] = useState<{
    type: 'equipment' | 'crew';
    id: string;
  } | null>(null);

  // Clear target scroll item after a delay to allow planner to process it
  useEffect(() => {
    if (targetScrollItem) {
      const timer = setTimeout(() => {
        setTargetScrollItem(null);
      }, 2000); // Give planner components time to load and scroll
      
      return () => clearTimeout(timer);
    }
  }, [targetScrollItem]);

  // Separate state for problems-only mode
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);

  // Shared timeline state for both planners
  const sharedTimeline = useSharedTimeline({ selectedDate });

  // Get projects data for owner extraction
  const { projects } = useProjects();

  // Extract unique project owners for the dropdown filter
  const ownerOptions = useOwnerOptions(projects, { 
    keyBy: 'id', 
    includeEmails: true 
  });



  return (
    <PageLayout
      icon={Calendar}
      title="Planner"
      description="Global resource availability and scheduling across all projects"
      iconColor="text-blue-500"
    >
      <div className="space-y-4">
        {/* Timeline Header - Outside calendar for better performance */}
        <TimelineHeader
          formattedDates={sharedTimeline.formattedDates}
          monthSections={sharedTimeline.monthSections}
          onDateChange={setSelectedDate}
          onHeaderScroll={(e) => {
            // IMPROVED: Enhanced header-to-content sync with RAF
            requestAnimationFrame(() => {
              const scrollLeft = e.currentTarget.scrollLeft;
              if (sharedTimeline.equipmentRowsRef.current && 
                  sharedTimeline.equipmentRowsRef.current.scrollLeft !== scrollLeft) {
                sharedTimeline.equipmentRowsRef.current.scrollLeft = scrollLeft;
              }
            });
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
          targetScrollItem={targetScrollItem}
        />
      </div>
    </PageLayout>
  );
};

export default Planner;