import { useState, useEffect } from "react";
import { Database } from "lucide-react";

// Import the custom header and table components
import { ResourcesHeader, ResourceFilters } from "@/components/resources/ResourcesHeader";
import { ResourceCrewTable } from "@/components/resources/tables/ResourceCrewTable";
import { ResourceEquipmentTable } from "@/components/resources/tables/ResourceEquipmentTable";
import { AddMemberDialog } from "@/components/crew/AddMemberDialog";
import { AddEquipmentDialog } from "@/components/equipment/AddEquipmentDialog";

const Resources = () => {
  // Initialize activeTab from localStorage, fallback to 'equipment'
  const [activeTab, setActiveTab] = useState<'equipment' | 'crew'>(() => {
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
            <ResourceCrewTable filters={filters} />
          ) : (
            <ResourceEquipmentTable filters={filters} />
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