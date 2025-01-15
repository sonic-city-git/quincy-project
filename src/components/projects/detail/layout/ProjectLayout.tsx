import { Tabs } from "@/components/ui/tabs";
import { ProjectHeader } from "../ProjectHeader";
import { ProjectTabs } from "../ProjectTabs";
import { Project } from "@/types/projects";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

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
    <Tabs 
      value={tab}
      className="h-full flex flex-col" 
      onValueChange={handleTabChange}
    >
      <div className="sticky top-0 z-10 bg-zinc-950 border-b border-zinc-800 px-8 py-6">
        <ProjectHeader 
          project={project}
          value={tab}
          onValueChange={handleTabChange}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <ProjectTabs 
          project={project}
          projectId={projectId}
          value={tab}
        />
      </div>
    </Tabs>
  );
}