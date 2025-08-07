/**
 * Financial Tab - Project financial management and invoicing
 */

import { DollarSign } from "lucide-react";
import { Project } from "@/types/projects";
import { ProjectTabCard } from "../shared/ProjectTabCard";
import { InvoiceDialog } from "./InvoiceDialog";
import { InvoiceSummary } from "./InvoiceSummary";
import { InvoiceButton } from "./InvoiceButton";

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
        headerExtra={<InvoiceButton projectId={projectId} />}
      >
        <InvoiceSummary project={project} />
      </ProjectTabCard>
    </div>
  );
}
