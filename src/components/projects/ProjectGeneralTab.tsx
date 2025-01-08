import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProjectCalendar } from "@/components/events/ProjectCalendar";
import { OwnerSelect } from "./owner/OwnerSelect";
import { CustomerSelect } from "./customer/CustomerSelect";
import { FinancialInfo } from "./financial/FinancialInfo";

interface ProjectGeneralTabProps {
  projectId: string;
  initialOwner: string;
  initialCustomer: string;
  gigPrice: string;
  yearlyRevenue: string;
}

export const ProjectGeneralTab = ({ 
  projectId, 
  initialOwner, 
  initialCustomer, 
  gigPrice, 
  yearlyRevenue 
}: ProjectGeneralTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1 h-fit">
        <CardContent className="p-6">
          <ProjectCalendar />
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <OwnerSelect 
                projectId={projectId}
                initialOwner={initialOwner}
              />
              <Separator className="my-4" />
              <CustomerSelect 
                projectId={projectId}
                initialCustomer={initialCustomer}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <FinancialInfo 
              gigPrice={gigPrice}
              yearlyRevenue={yearlyRevenue}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};