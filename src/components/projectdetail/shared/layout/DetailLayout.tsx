import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProjectTabs } from "../tabs/DetailTabs";
import { Project } from "@/types/projects";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Building2, Database, DollarSign } from "lucide-react";
import { COMPONENT_CLASSES, RESPONSIVE, SPACING, cn } from "@/design-system";

interface ProjectLayoutProps {
  project: Project;
  projectId: string;
}

// Tab configuration using design system patterns
const TAB_CONFIG = {
  general: {
    label: 'General',
    icon: Building2,
    activeClasses: 'bg-secondary/10 text-secondary border-secondary/20'
  },
  resources: {
    label: 'Resources',
    icon: Database,
    activeClasses: 'bg-primary/10 text-primary border-primary/20'
  },
  financial: {
    label: 'Financial',
    icon: DollarSign,
    activeClasses: 'bg-accent/10 text-accent border-accent/20'
  }
} as const;

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
    <Tabs value={tab} onValueChange={handleTabChange} className={RESPONSIVE.spacing.section}>
      {/* Sticky Tab Navigation */}
      <div className={cn(
        "sticky top-0 z-20 bg-background/95 backdrop-blur-sm",
        "border-b border-border shadow-sm"
      )}>
        <div className="w-full p-4">
          <div className="flex bg-muted rounded-lg p-1">
            {Object.entries(TAB_CONFIG).map(([tabKey, config]) => {
              const Icon = config.icon;
              const isActive = tab === tabKey;
              
              return (
                <Button
                  key={tabKey}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTabChange(tabKey)}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    isActive ? config.activeClasses : 'hover:bg-muted/50'
                  )}
                  aria-pressed={isActive}
                  aria-label={`Switch to ${config.label} tab`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className={RESPONSIVE.spacing.section}>
        <ProjectTabs 
          project={project}
          projectId={projectId}
          value={tab}
        />
      </div>
    </Tabs>
  );
}