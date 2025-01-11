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

  const formattedProjectNumber = String(project.project_number).padStart(4, '0');

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background z-10 p-8 pb-0 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-fit">
            <div 
              className="px-3.5 py-2 rounded-md font-medium"
              style={getColorStyles(project.color)}
            >
              <span className="text-3xl">{project.name}</span>
            </div>
          </div>
          <div className="text-lg text-muted-foreground">
            #{formattedProjectNumber}
          </div>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-8 pt-4">
            <TabsContent value="general">
              <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="w-full">
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
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetail;