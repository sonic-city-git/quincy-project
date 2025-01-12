import { CustomerSelect } from "@/components/projects/forms/CustomerSelect";
import { OwnerSelect } from "@/components/projects/forms/OwnerSelect";
import { formatDisplayDate } from "@/utils/dateFormatters";
import { Project } from "@/types/projects";
import { ProjectInvoiceButton } from "./ProjectInvoiceButton";
import { useState } from "react";
import { InvoiceDialog } from "../invoice/InvoiceDialog";
import { CalendarEvent } from "@/types/events";

interface ProjectInfoProps {
  project: Project;
  events?: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => Promise<void>;
}

export function ProjectInfo({ project, events = [], onStatusChange }: ProjectInfoProps) {
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

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
          <div className="text-sm bg-zinc-900/50 px-3 py-2 rounded-md border border-zinc-700">
            {formatDate(project.created_at)}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">To be Invoiced</label>
          <div className="text-sm font-medium bg-zinc-900/50 px-3 py-2 rounded-md border border-zinc-700">
            {formatCurrency(project.to_be_invoiced)}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <ProjectInvoiceButton onClick={() => setIsInvoiceDialogOpen(true)} />
      </div>

      <InvoiceDialog 
        isOpen={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        events={events}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}