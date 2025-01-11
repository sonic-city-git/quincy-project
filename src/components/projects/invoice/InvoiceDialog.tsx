import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarEvent } from "@/types/events";
import { format } from "date-fns";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
}

export function InvoiceDialog({ isOpen, onClose, events }: InvoiceDialogProps) {
  const invoiceReadyEvents = events.filter(event => event.status === 'invoice ready');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('no-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice Ready Events</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {invoiceReadyEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No events ready for invoicing
            </div>
          ) : (
            <div className="space-y-6">
              {invoiceReadyEvents.map((event) => (
                <div key={`${event.date}-${event.name}`} className="space-y-4">
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
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Generate Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}