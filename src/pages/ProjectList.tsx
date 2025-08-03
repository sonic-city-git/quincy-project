import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useTabPersistence } from "@/hooks/useTabPersistence";

// Import the new unified header and table components
import { ProjectsHeader, ProjectFilters } from "@/components/projects/ProjectsHeader";
import { ProjectsTable } from "@/components/projects/tables/ProjectsTable";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";

const ProjectList = () => {
  // Use consolidated tab persistence hook
  const [activeTab, setActiveTab] = useTabPersistence(
    'projects-active-tab',
    'active',
    ['active', 'archived'] as const
  );

  // Filter state
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    owner: ''
  });

  // Add Project dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Tab persistence is now handled by useTabPersistence hook

  return (
    <PageLayout
      icon={CalendarDays}
      title="Projects"
      description="Manage and organize all your production projects"
      iconColor="text-purple-500"
    >
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
    </PageLayout>
  );
};

export default ProjectList;