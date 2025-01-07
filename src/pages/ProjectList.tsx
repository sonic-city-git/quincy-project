import { ProjectList as ProjectListComponent } from "@/components/ProjectList";

const ProjectList = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
      </div>
      <ProjectListComponent />
    </div>
  );
};

export default ProjectList;