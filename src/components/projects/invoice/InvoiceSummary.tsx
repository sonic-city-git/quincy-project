import { CalendarEvent } from "@/types/events";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface InvoiceSummaryProps {
  event: CalendarEvent;
}

export function InvoiceSummary({ event }: InvoiceSummaryProps) {
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
          <h3 className="font-semibold">{event.name}</h3>
          <p className="text-sm text-muted-foreground">
            {format(event.date, 'PPP')}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatCurrency(event.revenue || 0)}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Equipment</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Crew</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Additional Cost</span>
          <span>{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Discount</span>
          <span>-{formatCurrency(0)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>VAT (25%)</span>
          <span>{formatCurrency((event.revenue || 0) * 0.25)}</span>
        </div>
      </div>

      <Separator />
    </div>
  );
}