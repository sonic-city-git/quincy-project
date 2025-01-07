import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectGeneralTab } from "@/components/projects/ProjectGeneralTab";

const MOCK_PROJECTS = {
  "sondre-justad": {
    name: "Sondre Justad",
    lastInvoiced: "28.06.24",
    owner: "Sondre Sandhaug",
    customer: "Universal Music",
    color: "bg-amber-700",
    gigPrice: "15 000 000kr",
    yearlyRevenue: "180 000 000kr"
  },
  "briskeby": {
    name: "Briskeby",
    lastInvoiced: "29.09.24",
    owner: "Stian Sagholen",
    customer: "Sony Music",
    color: "bg-rose-800",
    gigPrice: "12 000 000kr",
    yearlyRevenue: "144 000 000kr"
  },
  "highasakite": {
    name: "Highasakite",
    lastInvoiced: "28.06.24",
    owner: "Raymond Hellem",
    customer: "Warner Music",
    color: "bg-blue-700",
    gigPrice: "18 000 000kr",
    yearlyRevenue: "216 000 000kr"
  }
};

const ProjectDetails = () => {
  const { projectId } = useParams();
  const project = projectId ? MOCK_PROJECTS[projectId as keyof typeof MOCK_PROJECTS] : null;

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Project not found</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ProjectHeader 
        name={project.name}
        lastInvoiced={project.lastInvoiced}
        color={project.color}
      />

      <div className="max-w-7xl mx-auto px-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <ProjectGeneralTab 
              projectId={projectId || ""}
              initialOwner={project.owner}
              initialCustomer={project.customer}
              gigPrice={project.gigPrice}
              yearlyRevenue={project.yearlyRevenue}
            />
          </TabsContent>

          <TabsContent value="equipment">
            <div className="text-sm text-muted-foreground">
              Equipment content coming soon...
            </div>
          </TabsContent>

          <TabsContent value="crew">
            <div className="text-sm text-muted-foreground">
              Crew content coming soon...
            </div>
          </TabsContent>

          <TabsContent value="financial">
            <div className="text-sm text-muted-foreground">
              Financial content coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetails;