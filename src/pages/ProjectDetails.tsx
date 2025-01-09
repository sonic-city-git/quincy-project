import { useParams } from "react-router-dom";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useToast } from "@/hooks/use-toast";

const ProjectDetails = () => {
  const { id } = useParams();
  const { project, loading } = useProjectDetails(id);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zinc-800 rounded w-1/4"></div>
          <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
          <div className="h-32 bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Project not found</h1>
        <p className="text-lg text-zinc-400 mb-6">
          The project you're looking for could not be found. This might be because:
        </p>
        <ul className="space-y-2 text-zinc-400 list-disc list-inside text-left max-w-md mx-auto">
          <li>The project ID is incorrect</li>
          <li>The project has been deleted</li>
          <li>You don't have access to this project</li>
        </ul>
      </div>
    );
  }

  const projectData = {
    ...project,
    owner_id: project.customer_id,
    customer: project.customer_id,
    color: 'blue',
    last_invoiced: null,
    gig_price: null,
    yearly_revenue: null
  };

  return (
    <div className="min-h-screen">
      <ProjectHeader 
        name={projectData.name}
        lastInvoiced={projectData.last_invoiced}
        color={projectData.color}
      />
      <div className="max-w-7xl mx-auto px-6">
        <ProjectTabs 
          projectId={id || ""}
          project={projectData}
        />
      </div>
    </div>
  );
};

export default ProjectDetails;