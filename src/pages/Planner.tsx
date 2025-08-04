import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useOwnerOptions } from "@/hooks/useOwnerOptions";
import { useProjects } from "@/hooks/useProjects";
import { useFilterState } from "@/hooks/useFilterState";
import { UnifiedCalendar } from "@/components/planner/UnifiedCalendar";
import { PlannerFilters } from "@/components/planner/shared/components/TimelineHeader";
import { PlannerHeader } from "@/components/planner/PlannerHeader";



import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Planner = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // STABLE: Initialize once with today's date and don't change it on mount
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  // Remove the aggressive useEffect that was causing double date setting
  
  // Use consolidated tab persistence hook
  const [activeTab, setActiveTab] = useTabPersistence(
    'planner-active-tab',
    'equipment',
    ['equipment', 'crew'] as const
  );

  // Note: Removed localStorage persistence - always start fresh with today's date on page refresh
  
  // Filter state
  const [filters, setFilters, updateFilters, clearFilters] = useFilterState<PlannerFilters>({
    search: '',
    selectedOwner: '',
    equipmentType: '',
    crewRole: ''
  });

  // OPTIMIZED: Handle URL parameters for direct navigation (run only once per URL change)
  useEffect(() => {
    const equipmentId = searchParams.get('equipment');
    const crewId = searchParams.get('crew');
    const projectId = searchParams.get('project');

    // Only process if there are actual parameters to handle
    if (!equipmentId && !crewId && !projectId) return;

    if (equipmentId) {
      setActiveTab('equipment');
      setTargetScrollItem({ type: 'equipment', id: equipmentId });
    } else if (crewId) {
      setActiveTab('crew');
      setTargetScrollItem({ type: 'crew', id: crewId });
    }

    // Clear all parameters in one go
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('equipment');
    newParams.delete('crew');
    newParams.delete('project');
    setSearchParams(newParams, { replace: true });
  }, [searchParams.toString()]); // Only re-run when URL actually changes

  // State to track target item for scrolling
  const [targetScrollItem, setTargetScrollItem] = useState<{
    type: 'equipment' | 'crew';
    id: string;
  } | null>(null);

  // OPTIMIZED: Clear target scroll item after processing
  useEffect(() => {
    if (!targetScrollItem) return;
    
    const timer = setTimeout(() => {
      setTargetScrollItem(null);
    }, 1500); // Reduced timeout for faster response
    
    return () => clearTimeout(timer);
  }, [targetScrollItem]);

  // Separate state for problems-only mode
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);

  // SIMPLIFIED: Single scroll hook handles everything
  const { projects } = useProjects();


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
        {/* Planner Header with Tab Switching and Filters */}
        <PlannerHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filters={filters}
          onFiltersChange={setFilters}
          showProblemsOnly={showProblemsOnly}
          onToggleProblemsOnly={() => setShowProblemsOnly(!showProblemsOnly)}
        />

        {/* Timeline Calendar Content */}
        <UnifiedCalendar 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate}
          selectedOwner={filters.selectedOwner}
          resourceType={activeTab}
          filters={filters}
          showProblemsOnly={showProblemsOnly}
          targetScrollItem={targetScrollItem}
          renderOnlyTimeline={true}
        />
      </div>
    </PageLayout>
  );
};

export default Planner;