import { Project } from "@/types/projects";
import { Separator } from "@/components/ui/separator";

interface InvoiceSummaryProps {
  project: Project;
}

export function InvoiceSummary({ project }: InvoiceSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{project.name}</h3>
          <p className="text-sm text-muted-foreground">
            Project #{String(project.project_number).padStart(4, '0')}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatCurrency(project.to_be_invoiced || 0)}</p>
          <p className="text-sm text-muted-foreground">To Be Invoiced</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Equipment Total</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Crew Total</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Additional Costs</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Discounts</span>
          <span>-{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>VAT (25%)</span>
          <span>{formatCurrency((project.to_be_invoiced || 0) * 0.25)}</span>
        </div>
      </div>

      <Separator />
      
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Financial tracking and detailed invoicing coming soon.
        </p>
      </div>
    </div>
  );
}