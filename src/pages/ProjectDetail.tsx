import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { Card } from "@/components/ui/card";

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

  return (
    <div className="p-8 space-y-6">
      <div className="max-w-[500px]">
        <h1 
          className="text-2xl font-bold px-3.5 py-2 rounded-md"
          style={colorStyles}
        >
          {project.name}
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
            <h2 className="text-xl font-semibold mb-4">General Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Project Number:</span> {project.project_number}</p>
              <p><span className="font-medium">Owner:</span> {project.crew_members?.name || 'No owner assigned'}</p>
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