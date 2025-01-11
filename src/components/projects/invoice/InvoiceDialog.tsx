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
import { useQueryClient } from "@tanstack/react-query";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onStatusChange?: (event: CalendarEvent, newStatus: CalendarEvent['status']) => Promise<void>;
}

export function InvoiceDialog({ isOpen, onClose, events, onStatusChange }: InvoiceDialogProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const invoiceReadyEvents = events.filter(event => event.status === 'invoice ready');
  const totalEvents = invoiceReadyEvents.length;

  const handleGenerateInvoice = () => {
    setShowConfirmation(true);
  };

  const processEventBatch = async (events: CalendarEvent[], startIndex: number, batchSize: number) => {
    const endIndex = Math.min(startIndex + batchSize, events.length);
    const batch = events.slice(startIndex, endIndex);
    const failedEvents: CalendarEvent[] = [];

    for (const event of batch) {
      try {
        if (onStatusChange) {
          await onStatusChange(event, 'invoiced');
          setProcessedCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to update event:', event.id, error);
        failedEvents.push(event);
      }
    }

    return {
      failedEvents,
      nextIndex: endIndex,
      isComplete: endIndex >= events.length
    };
  };

  const handleConfirmInvoice = async () => {
    if (!onStatusChange || isProcessing) return;
    
    setIsProcessing(true);
    setProcessedCount(0);
    
    const batchSize = 2;
    let currentIndex = 0;
    const allFailedEvents: CalendarEvent[] = [];

    try {
      while (currentIndex < invoiceReadyEvents.length) {
        const {
          failedEvents,
          nextIndex,
          isComplete
        } = await processEventBatch(invoiceReadyEvents, currentIndex, batchSize);
        
        allFailedEvents.push(...failedEvents);
        currentIndex = nextIndex;

        if (!isComplete) {
          // Small delay between batches to prevent UI freeze
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Refresh the data once at the end
      await queryClient.invalidateQueries({ queryKey: ['events'] });

      // Close both dialogs
      setShowConfirmation(false);
      onClose();

      // Show appropriate toast based on results
      if (allFailedEvents.length === 0) {
        toast({
          title: "Invoice Generated",
          description: "All events have been marked as invoiced and sent to Tripletex",
        });
      } else {
        toast({
          title: "Partial Success",
          description: `${totalEvents - allFailedEvents.length} events processed. ${allFailedEvents.length} events failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessedCount(0);
    }
  };

  const progressText = isProcessing ? `Processing ${processedCount}/${totalEvents} events...` : '';

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
                  <InvoiceSummary key={event.id} event={event} />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateInvoice} 
              disabled={invoiceReadyEvents.length === 0 || isProcessing}
            >
              {isProcessing ? progressText : 'Generate Invoice'}
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
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmInvoice}
              disabled={isProcessing}
            >
              {isProcessing ? progressText : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}