import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FikenInvoiceStatusService } from '@/services/invoice/FikenInvoiceStatusService';
import { toast } from 'sonner';

export function useFikenInvoiceSync() {
  const queryClient = useQueryClient();

  const syncProjectInvoices = useCallback(async (projectId: string) => {
    try {
      console.log('🔄 Starting Fiken invoice sync for project:', projectId);
      
      const result = await FikenInvoiceStatusService.syncProjectInvoiceStatuses(projectId);
      
      if (result.success) {
        if (result.invoicesUpdated > 0 || result.eventsMarkedInvoiced > 0) {
          console.log(`✅ Fiken sync completed: ${result.invoicesUpdated} invoices updated, ${result.eventsMarkedInvoiced} events marked as invoiced`);
          
          // Invalidate relevant queries to refresh the UI
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['project-invoice-draft', projectId] }),
            queryClient.invalidateQueries({ queryKey: ['project-fiken-invoices', projectId] }),
            queryClient.invalidateQueries({ queryKey: ['invoice-ready-events', projectId] }),
            queryClient.invalidateQueries({ queryKey: ['events', projectId] }),
            queryClient.invalidateQueries({ queryKey: ['consolidated-events', projectId] })
          ]);

          // Show success message if any updates were made
          if (result.eventsMarkedInvoiced > 0) {
            toast.success(`${result.eventsMarkedInvoiced} events marked as invoiced from sent Fiken invoices`);
          }
        } else {
          console.log('ℹ️ No invoice status updates needed');
        }
      } else {
        console.error('❌ Fiken sync failed:', result.error);
        // Don't show error toast for missing credentials - just log it
        if (!result.error?.includes('credentials') && !result.error?.includes('not configured')) {
          toast.error(`Failed to sync with Fiken: ${result.error}`);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Error during Fiken sync:', error);
      toast.error('Failed to sync invoice statuses with Fiken');
      return {
        success: false,
        invoicesUpdated: 0,
        eventsMarkedInvoiced: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [queryClient]);

  const checkSingleInvoice = useCallback(async (invoiceId: string) => {
    try {
      return await FikenInvoiceStatusService.checkSingleInvoiceStatus(invoiceId);
    } catch (error) {
      console.error('❌ Error checking single invoice:', error);
      return false;
    }
  }, []);

  return {
    syncProjectInvoices,
    checkSingleInvoice
  };
}
