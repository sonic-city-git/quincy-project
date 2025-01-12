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
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Customer</label>
          <CustomerSelect
            value={project.customer_id || ''}
            onChange={() => {}}
            required={false}
            className="bg-zinc-900/50 border-zinc-700 hover:border-zinc-600 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Owner</label>
          <OwnerSelect
            value={project.owner_id || ''}
            onChange={() => {}}
            required={false}
            className="bg-zinc-900/50 border-zinc-700 hover:border-zinc-600 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Last Invoiced</label>
          <div className="text-sm">
            {formatDate(project.created_at)}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">To be Invoiced</label>
          <div className="text-sm font-medium">
            {formatCurrency(project.to_be_invoiced)}
          </div>
        </div>
      </div>
    </div>
  );
}