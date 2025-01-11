import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { Card } from "@/components/ui/card";
import { ProjectCalendar } from "@/components/projects/calendar/ProjectCalendar";

const ProjectDetail = () => {
  const { id } = useParams();
  const { project, loading } = useProjectDetails(id);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  const getColorStyles = (color: string) => {
    return {
      backgroundColor: `${color}80`,  // 80 in hex is 50% opacity
      color: '#FFFFFF'  // White text, fully opaque
    };
  };

  const colorStyles = getColorStyles(project.color);
  const formattedProjectNumber = String(project.project_number).padStart(4, '0');

  return (
    <div className="p-8 space-y-6">
      <div className="w-fit">
        <h1 
          className="text-3xl font-bold px-3.5 py-2 rounded-md"
          style={colorStyles}
        >
          {project.name} <span className="ml-2 opacity-75 text-lg">{formattedProjectNumber}</span>
        </h1>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="crew">Crew</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <ProjectCalendar projectId={id || ''} />
              </div>
              
              <div>
                <div className="space-y-2">
                  <p><span className="font-medium">Owner:</span> {project.crew_members?.name || 'No owner assigned'}</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card className="p-6">
            <h2 className="text-xl font-semibold">Equipment</h2>
            {/* Equipment content will be implemented in future iterations */}
          </Card>
        </TabsContent>

        <TabsContent value="crew">
          <Card className="p-6">
            <h2 className="text-xl font-semibold">Crew</h2>
            {/* Crew content will be implemented in future iterations */}
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card className="p-6">
            <h2 className="text-xl font-semibold">Financial</h2>
            {/* Financial content will be implemented in future iterations */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;