import { CustomerSelect } from "@/components/projects/forms/CustomerSelect";
import { OwnerSelect } from "@/components/projects/forms/OwnerSelect";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { Project } from "@/types/projects";
import { ProjectInvoiceButton } from "./ProjectInvoiceButton";
import { InvoiceDialog } from "../invoice/InvoiceDialog";
import { CalendarEvent } from "@/types/events";
import { useProjectTabActions } from "../shared/hooks/useProjectTabActions";
import { FORM_PATTERNS, cn } from "@/design-system";

interface ProjectInfoProps {
  project: Project;
  events?: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => Promise<void>;
}

export function ProjectInfo({ project, events = [], onStatusChange }: ProjectInfoProps) {
  // PERFORMANCE OPTIMIZATION: Use consolidated dialog state management
  const { addAction } = useProjectTabActions(['invoiceDialog']);
  const invoiceDialog = addAction('invoiceDialog');

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
    <div className={FORM_PATTERNS.layout.singleColumn}>
      <div className={FORM_PATTERNS.field.group}>
        {/* Customer Field */}
        <div className={FORM_PATTERNS.field.default}>
          <label className={FORM_PATTERNS.label.optional}>Customer</label>
          <CustomerSelect
            value={project.customer_id || ''}
            onChange={() => {}}
            required={false}
            className={cn(
              FORM_PATTERNS.input.default,
              "bg-muted/50 hover:border-muted-foreground/50"
            )}
          />
        </div>

        {/* Owner Field */}
        <div className={FORM_PATTERNS.field.default}>
          <label className={FORM_PATTERNS.label.optional}>Owner</label>
          <OwnerSelect
            value={project.owner_id || ''}
            onChange={() => {}}
            required={false}
            className={cn(
              FORM_PATTERNS.input.default,
              "bg-muted/50 hover:border-muted-foreground/50"
            )}
          />
        </div>

        {/* Last Invoiced Field - Read-only */}
        <div className={FORM_PATTERNS.field.default}>
          <label className={FORM_PATTERNS.label.default}>Last Invoiced</label>
          <div className={cn(
            FORM_PATTERNS.input.disabled,
            "text-sm bg-muted/50 px-3 py-2 rounded-md"
          )}>
            {formatDate(project.created_at)}
          </div>
        </div>

        {/* To be Invoiced Field - Read-only with emphasis */}
        <div className={FORM_PATTERNS.field.default}>
          <label className={FORM_PATTERNS.label.default}>To be Invoiced</label>
          <div className={cn(
            FORM_PATTERNS.input.disabled,
            "text-sm font-medium bg-muted/50 px-3 py-2 rounded-md text-accent"
          )}>
            {formatCurrency(project.to_be_invoiced)}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <ProjectInvoiceButton onClick={() => invoiceDialog.setActive(true)} />
      </div>

      <InvoiceDialog 
        isOpen={invoiceDialog.isActive}
        onClose={() => invoiceDialog.setActive(false)}
        events={events}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}