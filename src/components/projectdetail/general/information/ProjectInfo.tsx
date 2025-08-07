import { CustomerSelect } from "@/components/shared/forms/CustomerSelect";
import { OwnerSelect } from "@/components/shared/forms/OwnerSelect";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { Project } from "@/types/projects";
import { CalendarEvent } from "@/types/events";
import { FORM_PATTERNS, cn } from "@/design-system";

interface ProjectInfoProps {
  project: Project;
  events?: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => Promise<void>;
}

export function ProjectInfo({ project, events = [], onStatusChange }: ProjectInfoProps) {

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
    <div className="space-y-1">
      {/* Customer Field */}
      <div className="space-y-0.5">
        <label className="text-xs font-medium text-muted-foreground">Customer</label>
        <CustomerSelect
          value={project.customer_id || ''}
          onChange={() => {}}
          required={false}
          className={cn(
            FORM_PATTERNS.input.default,
            "bg-muted/50 hover:border-muted-foreground/50 h-7 text-xs"
          )}
        />
      </div>

      {/* Owner Field */}
      <div className="space-y-0.5">
        <label className="text-xs font-medium text-muted-foreground">Owner</label>
        <OwnerSelect
          value={project.owner_id || ''}
          onChange={() => {}}
          required={false}
          className={cn(
            FORM_PATTERNS.input.default,
            "bg-muted/50 hover:border-muted-foreground/50 h-7 text-xs"
          )}
        />
      </div>

      {/* Last Invoiced Field - Read-only */}
      <div className="space-y-0.5">
        <label className="text-xs font-medium text-foreground">Last Invoiced</label>
        <div className={cn(
          FORM_PATTERNS.input.disabled,
          "text-xs bg-muted/50 px-2 py-1 rounded-md h-7 flex items-center"
        )}>
          {formatDate(project.created_at)}
        </div>
      </div>

      {/* To be Invoiced Field - Read-only with emphasis */}
      <div className="space-y-0.5">
        <label className="text-xs font-medium text-foreground">To be Invoiced</label>
        <div className={cn(
          FORM_PATTERNS.input.disabled,
          "text-xs font-medium bg-muted/50 px-2 py-1 rounded-md text-accent h-7 flex items-center"
        )}>
          {formatCurrency(project.to_be_invoiced)}
        </div>
      </div>
    </div>
  );
}