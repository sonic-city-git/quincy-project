import { ProjectList as ProjectListComponent } from "@/components/ProjectList";
import { syncCustomers } from "@/utils/syncCustomers";

const ProjectList = () => {
  // Trigger sync when component mounts
  syncCustomers().catch(console.error);

  return (
    <div className="p-8">
      <ProjectListComponent />
    </div>
  );
};

export default ProjectList;