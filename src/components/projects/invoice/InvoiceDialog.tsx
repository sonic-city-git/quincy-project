import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarEvent } from "@/types/events";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { InvoiceSummary } from "./InvoiceSummary";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => void;
}

export function InvoiceDialog({ isOpen, onClose, events, onStatusChange }: InvoiceDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const invoiceReadyEvents = events.filter(event => event.status === 'invoice ready');

  const handleGenerateInvoice = () => {
    setShowConfirmation(true);
  };

  const handleConfirmInvoice = () => {
    // Update all events to 'invoiced' status
    invoiceReadyEvents.forEach(event => {
      if (onStatusChange) {
        onStatusChange(event, 'invoiced');
      }
    });

    // Close both dialogs
    setShowConfirmation(false);
    onClose();

    // Show success toast
    toast({
      title: "Invoice Generated",
      description: "Events have been marked as invoiced and sent to Tripletex",
    });
  };

  return (
    <>
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
                  <InvoiceSummary key={`${event.date}-${event.name}`} event={event} />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={invoiceReadyEvents.length === 0}>
              Generate Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Send invoice to Tripletex and move events to Invoiced status?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInvoice}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}