import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Database } from "lucide-react";

// Import the custom header and table components
import { ResourcesHeader, ResourceFilters } from "@/components/resources/ResourcesHeader";
import { ResourceCrewTable } from "@/components/resources/tables/ResourceCrewTable";
import { ResourceEquipmentTable } from "@/components/resources/tables/ResourceEquipmentTable";
import { AddMemberDialog } from "@/components/crew/AddMemberDialog";
import { AddEquipmentDialog } from "@/components/equipment/AddEquipmentDialog";

const Resources = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize activeTab from URL or localStorage
  const [activeTab, setActiveTab] = useState<'equipment' | 'crew'>(() => {
    const urlType = searchParams.get('type');
    if (urlType === 'crew' || urlType === 'equipment') {
      return urlType;
    }
    try {
      const savedTab = localStorage.getItem('resources-active-tab');
      return (savedTab === 'crew' || savedTab === 'equipment') ? savedTab : 'equipment';
    } catch {
      return 'equipment';
    }
  });

  // Filter state
  const [filters, setFilters] = useState<ResourceFilters>({
    search: '',
    equipmentType: '',
    crewRole: ''
  });

  // Dialog states
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showAddEquipmentDialog, setShowAddEquipmentDialog] = useState(false);

  // State to track target item for scrolling
  const [targetScrollItem, setTargetScrollItem] = useState<{
    type: 'equipment' | 'crew';
    id: string;
  } | null>(null);

  // Handle URL parameters for direct navigation and scrolling
  useEffect(() => {
    const urlType = searchParams.get('type');
    const scrollToId = searchParams.get('scrollTo');

    if (urlType && (urlType === 'crew' || urlType === 'equipment')) {
      setActiveTab(urlType);
    }

    if (scrollToId && urlType) {
      setTargetScrollItem({ type: urlType as 'equipment' | 'crew', id: scrollToId });
      
      // Clear URL parameters after processing
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('type');
      newParams.delete('scrollTo');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Clear target scroll item after a delay to allow tables to render
  useEffect(() => {
    if (targetScrollItem) {
      const timer = setTimeout(() => {
        setTargetScrollItem(null);
      }, 2000); // Give tables time to load and render
      
      return () => clearTimeout(timer);
    }
  }, [targetScrollItem]);

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('resources-active-tab', activeTab);
    } catch (error) {
      console.warn('Could not save preferences to localStorage:', error);
    }
  }, [activeTab]);

  // Handle add button click
  const handleAddClick = () => {
    if (activeTab === 'crew') {
      setShowAddMemberDialog(true);
    } else {
      setShowAddEquipmentDialog(true);
    }
  };

  return (
    <div className="container max-w-[1600px] p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Database className="h-8 w-8 text-purple-500" />
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">
            Manage your crew members and equipment inventory across all projects
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Resources Header with Tab Switching and Filters */}
        <ResourcesHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filters={filters}
          onFiltersChange={setFilters}
          onAddClick={handleAddClick}
        />
        
        {/* Table Content - Structured like planner timeline */}
        <div className="space-y-4">
          {activeTab === 'crew' ? (
            <ResourceCrewTable 
              filters={filters} 
              targetScrollItem={targetScrollItem?.type === 'crew' ? targetScrollItem : null}
            />
          ) : (
            <ResourceEquipmentTable 
              filters={filters} 
              targetScrollItem={targetScrollItem?.type === 'equipment' ? targetScrollItem : null}
            />
          )}
        </div>
      </div>



      {/* Add Dialogs */}
      <AddMemberDialog 
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
      />
      <AddEquipmentDialog 
        open={showAddEquipmentDialog}
        onOpenChange={setShowAddEquipmentDialog}
      />
    </div>
  );
};

export default Resources;