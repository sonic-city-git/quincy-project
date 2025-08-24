import { supabase } from '@/integrations/supabase/client';

export class FikenInvoiceStatusService {

  /**
   * Sync invoice statuses for a specific project
   * Call this when opening a project or Financial tab
   */
  static async syncProjectInvoiceStatuses(projectId: string): Promise<{
    success: boolean;
    invoicesUpdated: number;
    eventsMarkedInvoiced: number;
    error?: string;
  }> {
    try {
      console.log(`🔄 Syncing invoice statuses for project ${projectId}...`);

      // Call the Supabase Edge Function to handle the sync
      const { data, error } = await supabase.functions.invoke('fiken-invoice-status-sync', {
        body: { projectId }
      });

      if (error) {
        console.error('❌ Error calling Fiken sync function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error from sync function');
      }

      console.log(`🎉 Sync completed: ${data.invoicesUpdated} invoices updated, ${data.eventsMarkedInvoiced} events marked as invoiced`);

      return {
        success: true,
        invoicesUpdated: data.invoicesUpdated || 0,
        eventsMarkedInvoiced: data.eventsMarkedInvoiced || 0
      };

    } catch (error) {
      console.error('❌ Project invoice sync error:', error);
      return {
        success: false,
        invoicesUpdated: 0,
        eventsMarkedInvoiced: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Quick check for a single invoice status
   * Note: This will sync the entire project, but that's efficient since we batch the checks
   */
  static async checkSingleInvoiceStatus(invoiceId: string): Promise<boolean> {
    try {
      // Get the project ID for this invoice
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('project_id, status')
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) {
        return false;
      }

      // If already marked as sent, return true
      if (invoice.status === 'sent') {
        return true;
      }

      // Otherwise, sync the entire project (efficient batch operation)
      const result = await this.syncProjectInvoiceStatuses(invoice.project_id);
      
      // Check if this specific invoice was updated
      return result.success && result.invoicesUpdated > 0;
    } catch (error) {
      console.error('❌ Error checking single invoice status:', error);
      return false;
    }
  }
}
