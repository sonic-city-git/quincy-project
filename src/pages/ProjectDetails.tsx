import { useParams } from "react-router-dom";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { useProjectDetails } from "@/hooks/useProjectDetails";

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { project, loading } = useProjectDetails(projectId);

  console.log('ProjectDetails - projectId:', projectId);
  console.log('ProjectDetails - project:', project);
  console.log('ProjectDetails - loading:', loading);

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Project not found</h1>
        <p className="mt-2 text-muted-foreground">
          The project you're looking for could not be found. This might be because:
        </p>
        <ul className="mt-2 list-disc list-inside text-muted-foreground">
          <li>The project ID is incorrect</li>
          <li>The project has been deleted</li>
          <li>You don't have access to this project</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ProjectHeader 
        name={project.name}
        lastInvoiced={project.last_invoiced}
        color={project.color}
      />

      <div className="max-w-7xl mx-auto px-6">
        <ProjectTabs 
          projectId={projectId || ""}
          project={project}
        />
      </div>
    </div>
  );
};

export default ProjectDetails;