/**
 * Financial Tab - Project financial management and invoicing
 */

import { DollarSign } from "lucide-react";
import { Project } from "@/types/projects";
import { ProjectTabCard } from "../shared/ProjectTabCard";
// Invoice functionality will be rebuilt later

interface FinancialTabProps {
  project: Project;
  projectId: string;
}

export function FinancialTab({ project, projectId }: FinancialTabProps) {
  return (
    <div className="space-y-8">
      {/* Invoice Management Section */}
      <ProjectTabCard 
        title="Invoice Management"
        icon={DollarSign}
        iconColor="text-green-500"
      >
        <div className="text-center text-muted-foreground py-8">
          Invoice functionality coming soon
        </div>
      </ProjectTabCard>
    </div>
  );
}
