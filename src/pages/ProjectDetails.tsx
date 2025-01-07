import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data - in a real app, this would come from an API or database
const MOCK_PROJECTS = {
  "sondre-justad": {
    name: "Sondre Justad",
    lastInvoiced: "28.06.24",
    owner: "Sondre Sandhaug",
    color: "bg-amber-700",
    gigPrice: "15 000 000kr",
    yearlyRevenue: "180 000 000kr"
  },
  "briskeby": {
    name: "Briskeby",
    lastInvoiced: "29.09.24",
    owner: "Stian Sagholen",
    color: "bg-rose-800",
    gigPrice: "12 000 000kr",
    yearlyRevenue: "144 000 000kr"
  },
  "highasakite": {
    name: "Highasakite",
    lastInvoiced: "28.06.24",
    owner: "Raymond Hellem",
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold inline-block px-6 py-3 rounded ${project.color} text-white`}>
          {project.name}
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Owner</p>
              <p className="font-medium">{project.owner}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Invoiced</p>
              <p className="font-medium">{project.lastInvoiced}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gig Price</p>
              <p className="font-medium">{project.gigPrice}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Yearly Revenue</p>
              <p className="font-medium">{project.yearlyRevenue}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDetails;