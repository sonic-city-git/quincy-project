import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { differenceInDays, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_CREW } from "@/data/mockCrew";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

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
  
  const sonicCityCrewMembers = MOCK_CREW.filter(crew => crew.folder === "Sonic City");
  
  const [selectedOwner, setSelectedOwner] = useState(project?.owner || "");
  const [selectedCustomer, setSelectedCustomer] = useState(project?.customer || "");
  const [date, setDate] = useState<Date | undefined>(new Date());

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold">Project not found</h1>
      </div>
    );
  }

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
                <p className="font-medium">{"0 kr"}</p>
              </div>
              <Button>
                <Send className="mr-2 h-4 w-4" /> Invoice
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-4">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Owner</p>
                        <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select owner" />
                          </SelectTrigger>
                          <SelectContent>
                            {sonicCityCrewMembers.map((crew) => (
                              <SelectItem key={crew.id} value={crew.name}>
                                {crew.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Universal Music">Universal Music</SelectItem>
                            <SelectItem value="Sony Music">Sony Music</SelectItem>
                            <SelectItem value="Warner Music">Warner Music</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Gig Price</p>
                        <p className="text-base font-medium">{project.gigPrice}</p>
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Yearly Revenue</p>
                        <p className="text-base font-medium">{project.yearlyRevenue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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