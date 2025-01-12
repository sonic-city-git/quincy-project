import { useParams } from "react-router-dom";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { useProjectEvents } from "@/components/projects/detail/hooks/useProjectEvents";
import { ProjectLayout } from "@/components/projects/detail/layout/ProjectLayout";

const ProjectDetail = () => {
  const { id } = useParams();
  const { project, loading } = useProjectDetails(id);
  const { events, handleStatusChange } = useProjectEvents(id || '');

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  return (
    <ProjectLayout 
      project={project}
      projectId={id || ''}
      events={events}
      onStatusChange={handleStatusChange}
    />
  );
};

export default ProjectDetail;