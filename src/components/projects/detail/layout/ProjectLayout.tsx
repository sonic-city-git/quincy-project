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

  // Ensure hash is set on initial load
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
      <ProjectHeader 
        name={project.name}
        color={project.color}
        projectNumber={project.project_number}
        defaultValue={tab}
      />
      <ProjectTabs 
        project={project}
        projectId={projectId}
        value={tab}
      />
    </Tabs>
  );
}