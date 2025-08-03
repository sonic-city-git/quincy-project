import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProjectTabs } from "../ProjectTabs";
import { Project } from "@/types/projects";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Settings, Package, Users, DollarSign } from "lucide-react";

interface ProjectLayoutProps {
  project: Project;
  projectId: string;
}

export function ProjectLayout({ project, projectId }: ProjectLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = location.hash.replace('#', '') || 'general';

  const handleTabChange = (value: string) => {
    navigate(`${location.pathname}#${value}`, { replace: true });
  };

  useEffect(() => {
    if (!location.hash) {
      navigate(`${location.pathname}#general`, { replace: true });
    }
  }, [location.pathname, location.hash, navigate]);

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
      {/* Sticky Tab Navigation */}
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="w-full p-4">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={tab === 'general' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('general')}
              className={`flex items-center gap-2 ${
                tab === 'general' ? 'bg-purple-100 text-purple-700' : ''
              }`}
            >
              <Settings className="h-4 w-4" />
              General
            </Button>
            <Button
              variant={tab === 'equipment' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('equipment')}
              className={`flex items-center gap-2 ${
                tab === 'equipment' ? 'bg-green-100 text-green-700' : ''
              }`}
            >
              <Package className="h-4 w-4" />
              Equipment
            </Button>
            <Button
              variant={tab === 'crew' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('crew')}
              className={`flex items-center gap-2 ${
                tab === 'crew' ? 'bg-orange-100 text-orange-700' : ''
              }`}
            >
              <Users className="h-4 w-4" />
              Crew
            </Button>
            <Button
              variant={tab === 'financial' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTabChange('financial')}
              className={`flex items-center gap-2 ${
                tab === 'financial' ? 'bg-blue-100 text-blue-700' : ''
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Financial
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        <ProjectTabs 
          project={project}
          projectId={projectId}
          value={tab}
        />
      </div>
    </Tabs>
  );
}