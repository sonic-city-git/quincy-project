/**
 * 🧾 PROJECT INVOICE SERVICE
 * 
 * Core service for project-level invoice management and Fiken integration
 * Follows QUINCY service patterns from src/services/pricing/ and src/services/stock/
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Invoice, 
  InvoiceWithDetails, 
  InvoiceLineItem,
  InvoiceEventLink,
  InvoiceInsert,
  InvoiceUpdate,
  CreateInvoiceRequest
} from "@/types/invoice";
import { CalendarEvent } from "@/types/events";
import { Customer } from "@/integrations/supabase/types/customer";

// =====================================================================================
// CORE PROJECT INVOICE SERVICE
// =====================================================================================

export class ProjectInvoiceService {
  
  // -------------------------------------------------------------------------------------
  // AUTO-DRAFT MANAGEMENT
  // -------------------------------------------------------------------------------------
  
  /**
   * Get or create project auto-draft invoice
   * Ensures each project has exactly one auto-draft at a time
   */
  async ensureProjectDraftExists(projectId: string): Promise<Invoice> {
    // Check for existing auto-draft
    let { data: draft, error: draftError } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_auto_draft', true)
      .eq('status', 'draft')
      .maybeSingle();
    
    if (draftError) {
      console.error('Error checking for existing draft:', draftError);
      throw new Error(`Failed to check for draft: ${draftError.message}`);
    }
    
    // Create new auto-draft if none exists
    if (!draft) {
      const newDraft: InvoiceInsert = {
        project_id: projectId,
        is_auto_draft: true,
        invoice_type: 'auto_draft',
        status: 'draft',
        subtotal_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days
      };
      
      const { data: createdDraft, error: createError } = await supabase
        .from('invoices')
        .insert(newDraft)
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating auto-draft:', createError);
        throw new Error(`Failed to create draft: ${createError.message}`);
      }
      
      draft = createdDraft;
      
      console.log('Created new auto-draft invoice:', draft.id);
    }
    
    return draft;
  }
  
  /**
   * Get project draft with full details (line items, events, project, customer)
   */
  async getProjectDraftWithDetails(projectId: string): Promise<InvoiceWithDetails | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        line_items:invoice_line_items(*),
        event_links:invoice_event_links(
          *,
          event:project_events(
            *,
            event_types(
              id,
              name,
              color,
              needs_crew,
              needs_equipment,
              crew_rate_multiplier
            )
          )
        ),
        project:projects(
          *,
          customer:customers(*)
        )
      `)
      .eq('project_id', projectId)
      .eq('is_auto_draft', true)
      .eq('status', 'draft')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching project draft:', error);
      throw new Error(`Failed to fetch draft: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Get all Fiken invoices for a project (non-draft invoices)
   */
  async getProjectFikenInvoices(projectId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_auto_draft', false)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching Fiken invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Get events that are ready to invoice for a project
   */
  async getInvoiceReadyEvents(projectId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('project_events')
      .select(`
        *,
        event_types(
          id,
          name,
          color,
          needs_crew,
          needs_equipment,
          crew_rate_multiplier
        )
      `)
      .eq('project_id', projectId)
      .eq('status', 'invoice ready')
      .not('id', 'in', `(
        SELECT DISTINCT event_id 
        FROM invoice_event_links iel
        JOIN invoices i ON i.id = iel.invoice_id
        WHERE i.is_auto_draft = true AND i.status = 'draft'
      )`)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching invoice ready events:', error);
      throw new Error(`Failed to fetch events: ${error.message}`);
    }
    
    // Transform to CalendarEvent format
    return (data || []).map(event => ({
      id: event.id,
      date: new Date(event.date),
      name: event.name,
      type: event.event_types,
      status: event.status as CalendarEvent['status'],
      equipment_price: event.equipment_price,
      crew_price: event.crew_price,
      total_price: event.total_price
    }));
  }
  
  // -------------------------------------------------------------------------------------
  // EVENT MANAGEMENT
  // -------------------------------------------------------------------------------------
  
  /**
   * Add event to project's auto-draft
   * Creates line items for crew and equipment automatically
   */
  async addEventToProjectDraft(eventId: string): Promise<void> {
    try {
      // Get event details
      const event = await this.getEvent(eventId);
      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }
      
      // Ensure project has an auto-draft
      const draft = await this.ensureProjectDraftExists(event.project_id);
      
      // Check if event is already linked
      const { data: existingLink } = await supabase
        .from('invoice_event_links')
        .select('*')
        .eq('invoice_id', draft.id)
        .eq('event_id', eventId)
        .maybeSingle();
      
      if (existingLink) {
        console.log('Event already linked to draft:', eventId);
        return;
      }
      
      // Create event link first
      const { error: linkError } = await supabase
        .from('invoice_event_links')
        .insert({
          invoice_id: draft.id,
          event_id: eventId,
          included_crew: false,
          included_equipment: false
        });
      
      if (linkError) {
        console.error('Error creating event link:', linkError);
        throw new Error(`Failed to link event: ${linkError.message}`);
      }
      
      // Create line items using database function
      const { error: lineItemsError } = await supabase
        .rpc('create_line_items_for_event', {
          p_invoice_id: draft.id,
          p_event_id: eventId
        });
      
      if (lineItemsError) {
        console.error('Error creating line items:', lineItemsError);
        throw new Error(`Failed to create line items: ${lineItemsError.message}`);
      }
      
      toast.success(`"${event.name}" added to project invoice`);
      
    } catch (error) {
      console.error('Error adding event to draft:', error);
      throw error;
    }
  }
  
  /**
   * Remove event from project draft
   */
  async removeEventFromDraft(eventId: string): Promise<void> {
    try {
      // Use database function for safe removal
      const { error } = await supabase
        .rpc('remove_event_from_draft_invoices', {
          p_event_id: eventId
        });
      
      if (error) {
        console.error('Error removing event from draft:', error);
        throw new Error(`Failed to remove event: ${error.message}`);
      }
      
      toast.success('Event removed from draft invoice');
      
    } catch (error) {
      console.error('Error removing event from draft:', error);
      throw error;
    }
  }
  
  // -------------------------------------------------------------------------------------
  // INVOICE CREATION & MANAGEMENT
  // -------------------------------------------------------------------------------------
  
  /**
   * Convert auto-draft to real invoice and prepare for Fiken
   * This prepares the invoice but doesn't send to Fiken yet
   */
  async convertDraftToInvoice(draftId: string): Promise<Invoice> {
    try {
      // Convert auto-draft to standard invoice
      const updates: InvoiceUpdate = {
        is_auto_draft: false,
        invoice_type: 'standard',
        status: 'draft', // Ready for Fiken creation
        invoice_date: new Date().toISOString().split('T')[0]
      };
      
      const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', draftId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error converting draft to invoice:', updateError);
        throw new Error(`Failed to convert draft: ${updateError.message}`);
      }
      
      return invoice;
      
    } catch (error) {
      console.error('Error converting draft to invoice:', error);
      throw error;
    }
  }
  
  /**
   * Update invoice with Fiken data after creation
   */
  async updateInvoiceWithFikenData(invoiceId: string, fikenData: {
    fiken_invoice_id: string;
    fiken_invoice_number: string;
    fiken_url: string;
  }): Promise<Invoice> {
    try {
      const updates: InvoiceUpdate = {
        fiken_invoice_id: fikenData.fiken_invoice_id,
        fiken_invoice_number: fikenData.fiken_invoice_number,
        fiken_url: fikenData.fiken_url,
        status: 'created_in_fiken',
        fiken_created_at: new Date().toISOString()
      };
      
      const { data: invoice, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating invoice with Fiken data:', error);
        throw new Error(`Failed to update invoice: ${error.message}`);
      }
      
      return invoice;
      
    } catch (error) {
      console.error('Error updating invoice with Fiken data:', error);
      throw error;
    }
  }
  
  /**
   * Mark events as invoiced and create new auto-draft
   */
  async finalizeInvoiceCreation(invoiceId: string, projectId: string): Promise<void> {
    try {
      // Get all events linked to this invoice
      const { data: eventLinks, error: linksError } = await supabase
        .from('invoice_event_links')
        .select('event_id')
        .eq('invoice_id', invoiceId);
      
      if (linksError) {
        throw new Error(`Failed to get event links: ${linksError.message}`);
      }
      
      if (eventLinks && eventLinks.length > 0) {
        // Mark events as invoiced
        const eventIds = eventLinks.map(link => link.event_id);
        const { error: statusError } = await supabase
          .from('project_events')
          .update({ status: 'invoiced' })
          .in('id', eventIds);
        
        if (statusError) {
          console.error('Error updating event statuses:', statusError);
          // Don't throw here - invoice creation succeeded
        }
      }
      
      // Create new auto-draft for future events
      await this.ensureProjectDraftExists(projectId);
      
    } catch (error) {
      console.error('Error finalizing invoice creation:', error);
      throw error;
    }
  }
  
  // -------------------------------------------------------------------------------------
  // UTILITY METHODS
  // -------------------------------------------------------------------------------------
  
  private async getEvent(eventId: string) {
    const { data, error } = await supabase
      .from('project_events')
      .select(`
        *,
        event_types(
          id,
          name,
          color,
          needs_crew,
          needs_equipment,
          crew_rate_multiplier
        )
      `)
      .eq('id', eventId)
      .single();
    
    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }
    
    return data;
  }
  
  /**
   * Create invoice in Fiken via Supabase Edge Function
   */
  async createInvoiceInFiken(invoiceId: string): Promise<Invoice> {
    try {
      // Get invoice with full details
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          line_items:invoice_line_items(*),
          project:projects(
            *,
            customer:customers(*)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (fetchError || !invoice) {
        throw new Error(`Failed to fetch invoice: ${fetchError?.message || 'Invoice not found'}`);
      }

      if (!invoice.project?.customer) {
        throw new Error('Invoice must have a customer');
      }

      // Call Supabase Edge Function to create invoice in Fiken
      const { data: fikenResult, error: fikenError } = await supabase.functions.invoke('fiken-invoice', {
        body: {
          action: 'create_draft',
          customer: invoice.project.customer,
          lineItems: invoice.line_items,
          dueDate: invoice.due_date,
          projectReference: `${invoice.project.name} (#${invoice.project.project_number})`
        }
      });

      if (fikenError) {
        throw new Error(`Fiken API error: ${fikenError.message}`);
      }

      if (!fikenResult.success) {
        throw new Error(`Failed to create invoice in Fiken: ${fikenResult.error}`);
      }

      // Update invoice with Fiken data
      const updatedInvoice = await this.updateInvoiceWithFikenData(invoiceId, {
        fiken_invoice_id: fikenResult.data.id,
        fiken_invoice_number: fikenResult.data.invoice_number,
        fiken_url: fikenResult.data.edit_url
      });

      // Finalize invoice creation (mark events as invoiced, create new draft)
      await this.finalizeInvoiceCreation(invoiceId, invoice.project_id);

      toast.success(`Invoice created in Fiken: ${fikenResult.data.invoice_number}`);
      
      return updatedInvoice;

    } catch (error) {
      console.error('Error creating invoice in Fiken:', error);
      toast.error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Sync invoice status from Fiken
   */
  async syncInvoiceStatus(invoiceId: string): Promise<void> {
    try {
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError || !invoice || !invoice.fiken_invoice_id) {
        throw new Error('Invoice not found or not linked to Fiken');
      }

      // Call Supabase Edge Function to sync status
      const { data: statusResult, error: statusError } = await supabase.functions.invoke('fiken-invoice', {
        body: {
          action: 'sync_status',
          fikenInvoiceId: invoice.fiken_invoice_id
        }
      });

      if (statusError || !statusResult.success) {
        throw new Error(`Failed to sync status: ${statusError?.message || statusResult.error}`);
      }

      // Update local invoice with synced data
      const updates: InvoiceUpdate = {
        status: statusResult.data.status,
        fiken_status: statusResult.data.fiken_status,
        sent_date: statusResult.data.sent_date,
        paid_date: statusResult.data.paid_date,
        last_synced_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Error updating invoice status:', updateError);
      }

    } catch (error) {
      console.error('Error syncing invoice status:', error);
      throw error;
    }
  }

  /**
   * Sync all project invoice statuses from Fiken
   */
  async syncAllProjectInvoices(projectId: string): Promise<void> {
    try {
      const invoices = await this.getProjectFikenInvoices(projectId);
      
      for (const invoice of invoices) {
        if (invoice.fiken_invoice_id) {
          try {
            await this.syncInvoiceStatus(invoice.id);
          } catch (error) {
            console.error(`Failed to sync invoice ${invoice.id}:`, error);
            // Continue with other invoices
          }
        }
      }
      
    } catch (error) {
      console.error('Error syncing project invoices:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Test Fiken API connection
   */
  async testFikenConnection(): Promise<boolean> {
    try {
      const { data: result, error } = await supabase.functions.invoke('fiken-invoice', {
        body: { action: 'test_connection' }
      });

      if (error) {
        console.error('Fiken connection test error:', error);
        return false;
      }

      return result.success;
      
    } catch (error) {
      console.error('Error testing Fiken connection:', error);
      return false;
    }
  }
}
