import { Calendar, Users, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PlannerFilters } from "./shared/components/TimelineHeader";

interface PlannerHeaderProps {
  activeTab: 'equipment' | 'crew';
  onTabChange: (tab: 'equipment' | 'crew') => void;
  filters: PlannerFilters;
  onFiltersChange: (filters: PlannerFilters) => void;
  showProblemsOnly: boolean;
  onToggleProblemsOnly: () => void;
}

export function PlannerHeader({
  activeTab,
  onTabChange,
  filters,
  onFiltersChange,
  showProblemsOnly,
  onToggleProblemsOnly,
}: PlannerHeaderProps) {
  
  // Tab configuration
  const tabs = [
    { 
      value: 'equipment' as const, 
      label: 'Equipment', 
      icon: Calendar,
      color: 'text-blue-500'
    },
    { 
      value: 'crew' as const, 
      label: 'Crew', 
      icon: Users,
      color: 'text-green-500'
    }
  ];

  // Determine current context
  const isCrewPlanner = activeTab === 'crew';
  const IconComponent = isCrewPlanner ? Users : Calendar;
  const iconColor = isCrewPlanner ? 'text-green-500' : 'text-blue-500';
  const title = isCrewPlanner ? 'Crew Planner' : 'Equipment Planner';

  // Filter update helper
  const updateFilters = (updates: Partial<PlannerFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      search: '',
      selectedOwner: '',
      equipmentType: '',
      crewRole: ''
    });
  };

  return (
    <SectionHeader
      header={{
        title,
        icon: IconComponent,
        iconColor
      }}
      tabs={{
        activeTab,
        onTabChange,
        options: tabs
      }}
      search={{
        placeholder: `Search ${isCrewPlanner ? 'crew' : 'equipment'}...`,
        value: filters.search,
        onChange: (value) => updateFilters({ search: value })
      }}
      filters={filters}
      onFiltersChange={onFiltersChange}
      onClearFilters={clearAllFilters}
      actions={
        <Button
          onClick={onToggleProblemsOnly}
          variant={showProblemsOnly ? "default" : "outline"}
          size="sm"
          className="h-7 px-3 text-xs"
        >
          {showProblemsOnly ? (
            <>
              <EyeOff className="h-3 w-3 mr-1.5" />
              Show All
            </>
          ) : (
            <>
              <Eye className="h-3 w-3 mr-1.5" />
              View Problems
            </>
          )}
        </Button>
      }
    >
      {/* Resource Type Filter - Only show if filters are provided */}
      <div className="flex items-center gap-1">
        {/* Add any additional filter controls here if needed */}
      </div>
    </SectionHeader>
  );
}