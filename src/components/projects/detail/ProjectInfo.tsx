import { CustomerSelect } from "@/components/projects/forms/CustomerSelect";
import { OwnerSelect } from "@/components/projects/forms/OwnerSelect";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { Project } from "@/types/projects";

interface ProjectInfoProps {
  project: Project;
}

export function ProjectInfo({ project }: ProjectInfoProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return formatDisplayDate(new Date(dateString));
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

  return (
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
  );
}