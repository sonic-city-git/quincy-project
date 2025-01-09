import { Card, CardContent } from "@/components/ui/card";
import { ProjectCalendar } from "@/components/events/ProjectCalendar";
import { CustomerSelect } from "./customer/CustomerSelect";
import { FinancialInfo } from "./financial/FinancialInfo";

interface ProjectGeneralTabProps {
  projectId: string;
  initialCustomer: string;
  gigPrice?: string | null;
  yearlyRevenue?: string | null;
}

export const ProjectGeneralTab = ({ 
  projectId, 
  initialCustomer, 
  gigPrice, 
  yearlyRevenue 
}: ProjectGeneralTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <FinancialInfo 
          gigPrice={gigPrice} 
          yearlyRevenue={yearlyRevenue}
        />
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-6">
            <CustomerSelect 
              projectId={projectId}
              initialCustomer={initialCustomer}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <ProjectCalendar projectId={projectId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}