import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";

// Import the new unified header and table components
import { ProjectsHeader, ProjectFilters } from "@/components/projects/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/tables/ProjectsTable";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";

const ProjectList = () => {
  // Initialize activeTab from localStorage, fallback to 'all'
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'draft'>(() => {
    try {
      const savedTab = localStorage.getItem('projects-active-tab');
      return (savedTab === 'all' || savedTab === 'active' || savedTab === 'completed' || savedTab === 'draft') 
        ? savedTab as 'all' | 'active' | 'completed' | 'draft'
        : 'all';
    } catch {
      return 'all';
    }
  });

  // Filter state
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    owner: '',
    status: ''
  });

  // Add Project dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('projects-active-tab', activeTab);
    } catch (error) {
      console.warn('Could not save preferences to localStorage:', error);
    }
  }, [activeTab]);

  return (
    <div className="container max-w-[1600px] p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <CalendarDays className="h-8 w-8 text-purple-500" />
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage and organize all your production projects
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Projects Header - Outside content for better performance */}
        <ProjectsHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          filters={filters}
          onFiltersChange={setFilters}
          onAddClick={() => setShowAddDialog(true)}
        />
        
        {/* Projects Table Content */}
        <div className="space-y-4">
          <ProjectsTable
            activeTab={activeTab}
            filters={filters}
          />
        </div>
      </div>

      {/* Add Project Dialog */}
      <AddProjectDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
};

export default ProjectList;