/**
 * 🧾 PROJECT INVOICING HOOK
 * 
 * React hook for managing project-level invoicing with Fiken integration
 * Follows QUINCY hook patterns and integrates with existing project/event hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ProjectInvoiceService } from '@/services/invoice/ProjectInvoiceService';
import { 
  InvoiceWithDetails, 
  Invoice, 
  ProjectInvoicingHook 
} from '@/types/invoice';
import { CalendarEvent } from '@/types/events';

// =====================================================================================
// HOOK IMPLEMENTATION
// =====================================================================================

export function useProjectInvoicing(projectId: string): ProjectInvoicingHook {
  const queryClient = useQueryClient();
  const [invoiceService] = useState(() => new ProjectInvoiceService());
  const [error, setError] = useState<Error | null>(null);

  // -------------------------------------------------------------------------------------
  // QUERIES
  // -------------------------------------------------------------------------------------

  // Get project auto-draft invoice
  const {
    data: projectDraft,
    isLoading: isDraftLoading,
    error: draftError,
    refetch: refetchDraft
  } = useQuery({
    queryKey: ['project-invoice-draft', projectId],
    queryFn: () => invoiceService.getProjectDraftWithDetails(projectId),
    enabled: !!projectId,
    staleTime: 0, // Always fresh - important for financial data
    refetchOnWindowFocus: true, // Refresh when tab becomes active
    refetchOnMount: true // Always refetch on mount
  });

  // Get Fiken invoices for project
  const {
    data: fikenInvoices = [],
    isLoading: isFikenLoading,
    error: fikenError,
    refetch: refetchFikenInvoices
  } = useQuery({
    queryKey: ['project-fiken-invoices', projectId],
    queryFn: () => invoiceService.getProjectFikenInvoices(projectId),
    enabled: !!projectId,
    staleTime: 0, // Always fresh - important for financial data
    refetchOnWindowFocus: true, // Refresh when tab becomes active
    refetchOnMount: true // Always refetch on mount
  });

  // Get invoice-ready events
  const {
    data: invoiceReadyEvents = [],
    isLoading: isEventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['invoice-ready-events', projectId],
    queryFn: () => invoiceService.getInvoiceReadyEvents(projectId),
    enabled: !!projectId,
    staleTime: 0, // Always fresh - important for financial data
    refetchOnWindowFocus: true, // Refresh when tab becomes active
    refetchOnMount: true // Always refetch on mount
  });

  // -------------------------------------------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------------------------------------------

  // Create invoice in Fiken
  const createInvoiceMutation = useMutation({
    mutationFn: async (draftId?: string) => {
      if (!draftId && !projectDraft?.id) {
        throw new Error('No draft invoice found to convert');
      }
      
      const invoiceId = draftId || projectDraft!.id;
      
      // First convert draft to standard invoice
      const standardInvoice = await invoiceService.convertDraftToInvoice(invoiceId);
      
      // Then create in Fiken
      return await invoiceService.createInvoiceInFiken(standardInvoice.id);
    },
    onSuccess: (invoice) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['project-invoice-draft', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-fiken-invoices', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-ready-events', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
      
      setError(null);
      toast.success(`Invoice created: ${invoice.fiken_invoice_number}`);
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      setError(error as Error);
      toast.error(`Failed to create invoice: ${error.message}`);
    }
  });

  // Add events to project draft
  const addEventsMutation = useMutation({
    mutationFn: async (eventIds: string[]) => {
      // Ensure draft exists first
      await invoiceService.ensureProjectDraftExists(projectId);
      
      // Add each event to the draft
      for (const eventId of eventIds) {
        await invoiceService.addEventToProjectDraft(eventId);
      }
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['project-invoice-draft', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-ready-events', projectId] });
      
      setError(null);
      toast.success('Events added to invoice draft');
    },
    onError: (error) => {
      console.error('Error adding events to draft:', error);
      setError(error as Error);
      toast.error(`Failed to add events: ${error.message}`);
    }
  });

  // Remove event from draft
  const removeEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await invoiceService.removeEventFromDraft(eventId);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['project-invoice-draft', projectId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-ready-events', projectId] });
      
      setError(null);
      toast.success('Event removed from draft');
    },
    onError: (error) => {
      console.error('Error removing event from draft:', error);
      setError(error as Error);
      toast.error(`Failed to remove event: ${error.message}`);
    }
  });

  // Sync invoice statuses
  const syncStatusesMutation = useMutation({
    mutationFn: async () => {
      await invoiceService.syncAllProjectInvoices(projectId);
    },
    onSuccess: () => {
      // Invalidate Fiken invoices query
      queryClient.invalidateQueries({ queryKey: ['project-fiken-invoices', projectId] });
      
      setError(null);
      toast.success('Invoice statuses synced');
    },
    onError: (error) => {
      console.error('Error syncing invoice statuses:', error);
      setError(error as Error);
      toast.error(`Failed to sync statuses: ${error.message}`);
    }
  });

  // -------------------------------------------------------------------------------------
  // EFFECTS
  // -------------------------------------------------------------------------------------

  // Handle query errors
  useEffect(() => {
    const firstError = draftError || fikenError || eventsError;
    if (firstError) {
      setError(firstError as Error);
    } else {
      setError(null);
    }
  }, [draftError, fikenError, eventsError]);

  // Force refresh when hook is used (Financial Tab accessed)
  useEffect(() => {
    if (projectId) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        refetchDraft();
        refetchFikenInvoices(); 
        refetchEvents();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [projectId, refetchDraft, refetchFikenInvoices, refetchEvents]);

  // -------------------------------------------------------------------------------------
  // CALLBACK FUNCTIONS
  // -------------------------------------------------------------------------------------

  const createInvoiceInFiken = useCallback(async (): Promise<Invoice> => {
    const result = await createInvoiceMutation.mutateAsync();
    return result;
  }, [createInvoiceMutation]);

  const addEventsToProjectDraft = useCallback(async (eventIds: string[]): Promise<void> => {
    await addEventsMutation.mutateAsync(eventIds);
  }, [addEventsMutation]);

  const removeEventFromDraft = useCallback(async (eventId: string): Promise<void> => {
    await removeEventMutation.mutateAsync(eventId);
  }, [removeEventMutation]);

  const syncInvoiceStatuses = useCallback(async (): Promise<void> => {
    await syncStatusesMutation.mutateAsync();
  }, [syncStatusesMutation]);

  // -------------------------------------------------------------------------------------
  // RETURN HOOK INTERFACE
  // -------------------------------------------------------------------------------------

  return {
    // Data
    projectDraft,
    fikenInvoices,
    invoiceReadyEvents,
    
    // Loading states
    isDraftLoading,
    isFikenLoading,
    isEventsLoading,
    
    // Actions
    createInvoiceInFiken,
    addEventsToProjectDraft,
    removeEventFromDraft,
    syncInvoiceStatuses,
    
    // Error state
    error
  };
}

// =====================================================================================
// UTILITY HOOKS
// =====================================================================================

/**
 * Hook for testing Fiken API connection
 */
export function useFikenConnection() {
  const [invoiceService] = useState(() => new ProjectInvoiceService());
  
  const {
    data: isConnected,
    isLoading: isTestingConnection,
    error: connectionError,
    refetch: testConnection
  } = useQuery({
    queryKey: ['fiken-connection-test'],
    queryFn: () => invoiceService.testFikenConnection(),
    enabled: true, // Auto-test connection on load
    retry: 1, // Retry once if it fails
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });

  return {
    isConnected: isConnected ?? false, // Default to false if undefined
    isTestingConnection,
    connectionError,
    testConnection
  };
}

/**
 * Hook for managing individual invoice operations
 */
export function useInvoiceOperations() {
  const queryClient = useQueryClient();
  const [invoiceService] = useState(() => new ProjectInvoiceService());

  // Sync individual invoice status
  const syncInvoiceStatus = useMutation({
    mutationFn: async (invoiceId: string) => {
      await invoiceService.syncInvoiceStatus(invoiceId);
    },
    onSuccess: (_, invoiceId) => {
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['project-fiken-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      
      toast.success('Invoice status updated');
    },
    onError: (error) => {
      console.error('Error syncing invoice status:', error);
      toast.error(`Failed to sync status: ${error.message}`);
    }
  });

  return {
    syncInvoiceStatus: syncInvoiceStatus.mutateAsync,
    isSyncing: syncInvoiceStatus.isPending
  };
}
