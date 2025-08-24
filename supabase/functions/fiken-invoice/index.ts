import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FikenInvoiceRequest {
  action: 'create_draft' | 'sync_status' | 'test_connection' | 'create_or_update_draft';
  customer?: any;
  lineItems?: any[];
  dueDate?: string;
  projectReference?: string;
  fikenInvoiceId?: string;
  // New parameters for create_or_update_draft
  invoice_id?: string;
  project_name?: string;
  project_type?: string;
  customer_fiken_id?: string;
  total_amount?: number;
  due_date?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let invoice_id: string | undefined; // Declare in outer scope for error handling
  
  try {
    // Get Fiken API configuration from Supabase secrets
    const fikenApiKey = Deno.env.get('FIKEN_API_KEY');
    const fikenCompanySlug = Deno.env.get('FIKEN_COMPANY_SLUG');
    const fikenBaseUrl = Deno.env.get('FIKEN_API_BASE_URL') || 'https://api.fiken.no/api/v2';

    if (!fikenApiKey || !fikenCompanySlug) {
      throw new Error('Fiken API credentials not configured');
    }

    const requestBody: FikenInvoiceRequest = await req.json();
    const { action, customer, lineItems, dueDate, projectReference, fikenInvoiceId, project_name, project_type, customer_fiken_id, total_amount, due_date } = requestBody;
    invoice_id = requestBody.invoice_id; // Assign to outer scope variable

    const fikenHeaders = {
      'Authorization': `Bearer ${fikenApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const getApiUrl = (endpoint: string) => `${fikenBaseUrl}/companies/${fikenCompanySlug}${endpoint}`;

    let result;

    switch (action) {
      case 'test_connection':
        // Test API connection
        const testResponse = await fetch(getApiUrl('/company'), {
          method: 'GET',
          headers: fikenHeaders
        });
        
        result = {
          success: testResponse.ok,
          status: testResponse.status,
          message: testResponse.ok ? 'Connection successful' : 'Connection failed'
        };
        break;

      case 'create_or_update_draft':
        if (!invoice_id || !customer_fiken_id || !total_amount || !due_date) {
          throw new Error('Missing required parameters for draft creation');
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Track webhook attempt
        if (req.headers.get('X-Webhook-Source') === 'supabase-trigger') {
          await supabase.rpc('track_fiken_webhook_attempt', { p_invoice_id: invoice_id });
        }

        // Check if invoice already has Fiken data (idempotency)
        const { data: existingInvoice, error: invoiceCheckError } = await supabase
          .from('invoices')
          .select('fiken_invoice_id, fiken_invoice_number, fiken_url')
          .eq('id', invoice_id)
          .single();

        if (invoiceCheckError) {
          throw new Error(`Failed to check existing invoice: ${invoiceCheckError.message}`);
        }

        // If already synced with a valid Fiken ID, update the existing draft
        if (existingInvoice.fiken_invoice_id && 
            existingInvoice.fiken_invoice_id !== 'unknown' && 
            existingInvoice.fiken_invoice_id !== 'created_but_unknown') {
          console.log(`Invoice ${invoice_id} already synced to Fiken: ${existingInvoice.fiken_invoice_id}`);
          console.log(`Updating existing Fiken draft ${existingInvoice.fiken_invoice_id}`);
          
          // Update the existing draft instead of creating a new one
          const updateDraftResponse = await fetch(getApiUrl(`/invoices/drafts/${existingInvoice.fiken_invoice_id}`), {
            method: 'PUT',
            headers: fikenHeaders,
            body: JSON.stringify({
              type: 'invoice',
              customerId: parseInt(customer_fiken_id),
              daysUntilDueDate: 30,
              invoiceText: project_name ? `Project: ${project_name}` : undefined,
              currency: 'NOK',
              lines: fikenDraftLines
            })
          });

          if (!updateDraftResponse.ok) {
            const errorText = await updateDraftResponse.text();
            console.error(`Failed to update draft in Fiken: ${errorText}`);
            // If update fails, we'll fall through to create a new draft
          } else {
            console.log(`✅ Successfully updated Fiken draft ${existingInvoice.fiken_invoice_id}`);
            
            result = {
              success: true,
              fiken_invoice_id: existingInvoice.fiken_invoice_id,
              fiken_invoice_number: existingInvoice.fiken_invoice_number,
              fiken_url: existingInvoice.fiken_url,
              status: 'updated_existing_draft',
              total_amount: total_amount
            };
            break;
          }
        }

        // Get line items for this invoice
        const { data: invoiceLineItems, error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .select('*')
          .eq('invoice_id', invoice_id);

        if (lineItemsError) {
          throw new Error(`Failed to get line items: ${lineItemsError.message}`);
        }

        if (!invoiceLineItems || invoiceLineItems.length === 0) {
          throw new Error('No line items found for invoice');
        }

        // Convert line items to Fiken format using products
        const fikenDraftLines = invoiceLineItems.map(item => {
          const productId = getFikenProductId(project_type, item.source_type);
          return {
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unit_price),
            product: productId, // Try 'product' instead of 'productId'
            // Add VAT type and income account as backup
            vatType: productId === '02' ? 'OUTSIDE' : 'HIGH',
            incomeAccount: productId === '02' ? '3220' : '3020' // Use the account codes from your products
          };
        });

        // Create draft invoice in Fiken - using correct draft format from API docs
        const draftInvoiceRequest = {
          type: 'invoice', // lowercase as per API docs
          customerId: parseInt(customer_fiken_id), // Top-level customerId is required
          daysUntilDueDate: 30, // Standard 30 days payment terms
          // paymentAccount only for CASH_INVOICE type, not regular invoices
          invoiceText: project_name ? `Project: ${project_name}` : undefined,
          currency: 'NOK',
          lines: fikenDraftLines
        };

        const createDraftResponse = await fetch(getApiUrl('/invoices/drafts'), {
          method: 'POST',
          headers: fikenHeaders,
          body: JSON.stringify(draftInvoiceRequest)
        });

        if (!createDraftResponse.ok) {
          const errorText = await createDraftResponse.text();
          throw new Error(`Failed to create draft in Fiken: ${errorText}`);
        }

        // Handle potential empty response
        const responseText = await createDraftResponse.text();
        console.log('🔍 Fiken API response:', responseText);
        let draftResult;
        try {
          draftResult = responseText ? JSON.parse(responseText) : {};
          console.log('📋 Parsed Fiken response:', JSON.stringify(draftResult, null, 2));
        } catch (parseError) {
          console.warn('Failed to parse Fiken response, but invoice may have been created:', responseText);
          draftResult = {};
        }

        // If we got a successful response but no data, the draft was likely created
        // but Fiken doesn't return the draft details. Let's fetch recent drafts to find it.
        if (Object.keys(draftResult).length === 0 && createDraftResponse.ok) {
          console.log('📝 Empty response from Fiken - fetching recent drafts to find the created one');
          
          try {
            // Fetch recent drafts to find the one we just created
            const draftsResponse = await fetch(getApiUrl('/invoices/drafts'), {
              headers: fikenHeaders
            });
            
            if (draftsResponse.ok) {
              const drafts = await draftsResponse.json();
              console.log(`📋 Found ${drafts.length} drafts in Fiken`);
              
              // Find the most recent draft (assuming it's the one we just created)
              if (drafts && drafts.length > 0) {
                const mostRecentDraft = drafts[0]; // Assuming drafts are sorted by creation date
                draftResult = {
                  draftId: mostRecentDraft.draftId,
                  invoiceNumber: mostRecentDraft.invoiceNumber,
                  status: 'draft_found'
                };
                console.log(`✅ Found recent draft: ${mostRecentDraft.draftId}`);
              } else {
                console.warn('⚠️ No drafts found in Fiken after creation');
                draftResult = {
                  draftId: 'created_but_not_found',
                  status: 'draft_created_but_not_found'
                };
              }
            } else {
              console.warn('⚠️ Failed to fetch drafts from Fiken');
              draftResult = {
                draftId: 'created_but_unknown',
                status: 'draft_created'
              };
            }
          } catch (fetchError) {
            console.error('❌ Error fetching drafts:', fetchError);
            draftResult = {
              draftId: 'created_but_unknown',
              status: 'draft_created'
            };
          }
        }
        
        // Update Supabase invoice with Fiken data
        // For drafts, Fiken returns draftId instead of id
        const fikenId = draftResult.draftId || draftResult.id || 'unknown';
        const fikenNumber = draftResult.invoiceNumber || draftResult.invoice_number || null;
        
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            needs_fiken_sync: false,
            fiken_invoice_id: fikenId.toString(),
            fiken_invoice_number: fikenNumber,
            fiken_url: `https://fiken.no/${fikenCompanySlug}/invoices/drafts/${fikenId}`,
            fiken_sync_error: null,
            fiken_sync_failed_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice_id);

        if (updateError) {
          console.error('Failed to update invoice with Fiken data:', updateError);
          // Don't throw - Fiken invoice was created successfully
        }

        console.log(`Successfully created Fiken draft ${fikenId} for invoice ${invoice_id}`);
        
        result = {
          success: true,
          fiken_invoice_id: fikenId,
          fiken_invoice_number: fikenNumber,
          fiken_url: `https://fiken.no/${fikenCompanySlug}/invoices/drafts/${fikenId}`,
          status: draftResult.status,
          total_amount: draftResult.total_amount
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Fiken API error:', error);
    
    // If this was a webhook call and we have an invoice_id, update the error status
    if (req.headers.get('X-Webhook-Source') === 'supabase-trigger' && invoice_id) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('invoices')
          .update({
            needs_fiken_sync: false, // Don't retry immediately
            fiken_sync_error: error.message || 'Unknown error occurred',
            fiken_sync_failed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice_id);
          
        console.log(`Updated invoice ${invoice_id} with error status`);
      } catch (updateError) {
        console.error('Failed to update invoice error status:', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Utility functions
function getFikenProductId(projectType: string, sourceType: string): string {
  // Determine which Fiken product to use based on project type
  // Artist projects are VAT-free (domestic), others are 25% VAT
  
  if (projectType === 'Artist') {
    return '02'; // "Tjenester utenfor MVA" - VAT-free services
  } else {
    // broadcast, corporate, dry_hire get 25% VAT
    return '01'; // "Tjenester" - 25% VAT services
  }
}