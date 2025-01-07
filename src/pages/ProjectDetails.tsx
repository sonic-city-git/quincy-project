import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { differenceInDays, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

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

  // Calculate accumulated cost since last invoice
  const calculateAccumulatedCost = () => {
    const lastInvoiceDate = parse(project.lastInvoiced, "dd.MM.yy", new Date());
    const today = new Date();
    const daysSinceInvoice = differenceInDays(today, lastInvoiceDate);
    
    // Extract numeric value from gigPrice (removing "kr" and spaces)
    const gigPriceValue = parseInt(project.gigPrice.replace(/[^0-9]/g, ''));
    const dailyRevenue = gigPriceValue / 30; // Assuming monthly revenue
    
    return `${Math.round(dailyRevenue * daysSinceInvoice).toLocaleString()} kr`;
  };

  return (
    <div className="min-h-screen">
      <div className="w-full bg-secondary/20 px-6 py-6 mb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className={`${project.color} p-4 rounded-lg`}>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Last Invoiced</p>
                <p className="font-medium">{project.lastInvoiced}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Accumulated Cost</p>
                <p className="font-medium">{calculateAccumulatedCost()}</p>
              </div>
              <Button>
                <Send className="mr-2 h-4 w-4" /> Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader />
            <CardContent className="p-4 pt-0 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="text-base">{project.owner}</p>
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="text-base">{project.customer}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader />
            <CardContent className="p-4 pt-0 space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Gig Price</p>
                <p className="text-base">{project.gigPrice}</p>
                <Separator className="my-2" />
                <p className="text-sm text-muted-foreground">Yearly Revenue</p>
                <p className="text-base">{project.yearlyRevenue}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
