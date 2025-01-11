import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectDetails } from "@/hooks/useProjectDetails";
import { Card } from "@/components/ui/card";
import { ProjectCalendar } from "@/components/projects/calendar/ProjectCalendar";
import { CustomerSelect } from "@/components/projects/forms/CustomerSelect";
import { OwnerSelect } from "@/components/projects/forms/OwnerSelect";
import { format, parseISO } from "date-fns";

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd.MM.yy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('no-NO', { 
      style: 'currency', 
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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

          <TabsContent value="general">
            <Card>
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                  <div className="w-full">
                    <ProjectCalendar projectId={id || ''} />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Customer</label>
                      <CustomerSelect
                        value={project.customer_id || ''}
                        onChange={() => {}}
                        required={false}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Owner</label>
                      <OwnerSelect
                        value={project.owner_id || ''}
                        onChange={() => {}}
                        required={false}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Last Invoiced</label>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(project.created_at)}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">To be Invoiced</label>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(project.to_be_invoiced)}
                      </div>
                    </div>
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
    </div>
  );
};

export default ProjectDetail;