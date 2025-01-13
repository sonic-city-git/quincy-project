import { useParams } from "react-router-dom";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { ProjectLayout } from "@/components/projects/detail/layout/ProjectLayout";

const ProjectDetail = () => {
  const { id } = useParams();
  const { project, loading } = useProjectDetails(id);

  if (loading) {
    return <div className="container max-w-[1400px] p-8">Loading...</div>;
  }

  if (!project) {
    return <div className="container max-w-[1400px] p-8">Project not found</div>;
  }

  return (
    <div className="container max-w-[1400px] p-8">
      <ProjectLayout 
        project={project}
        projectId={id || ''}
      />
    </div>
  );
};

export default ProjectDetail;