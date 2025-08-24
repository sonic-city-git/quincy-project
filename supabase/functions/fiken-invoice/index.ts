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
  customer_fiken_id?: string;
  total_amount?: number;
  due_date?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Fiken API configuration from Supabase secrets
    const fikenApiKey = Deno.env.get('FIKEN_API_KEY');
    const fikenCompanySlug = Deno.env.get('FIKEN_COMPANY_SLUG');
    const fikenBaseUrl = Deno.env.get('FIKEN_API_BASE_URL') || 'https://api.fiken.no/api/v2';

    if (!fikenApiKey || !fikenCompanySlug) {
      throw new Error('Fiken API credentials not configured');
    }

    const { action, customer, lineItems, dueDate, projectReference, fikenInvoiceId, invoice_id, project_name, customer_fiken_id, total_amount, due_date }: FikenInvoiceRequest = await req.json();

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

      case 'create_draft':
        if (!customer || !lineItems || !dueDate) {
          throw new Error('Missing required parameters for invoice creation');
        }

        // First, ensure customer exists in Fiken
        let fikenCustomer;
        
        // Try to find existing customer by organization number
        if (customer.organization_number) {
          const customerSearchResponse = await fetch(
            getApiUrl(`/contacts?organizationNumber=${encodeURIComponent(customer.organization_number)}`),
            {
              method: 'GET',
              headers: fikenHeaders
            }
          );
          
          if (customerSearchResponse.ok) {
            const existingCustomers = await customerSearchResponse.json();
            if (existingCustomers.length > 0) {
              fikenCustomer = existingCustomers[0];
            }
          }
        }

        // Create customer if not found
        if (!fikenCustomer) {
          const customerData = {
            name: customer.name,
            email: customer.email || undefined,
            phone: customer.phone_number || undefined,
            organizationNumber: customer.organization_number || undefined,
            customerNumber: customer.customer_number || undefined
          };

          const createCustomerResponse = await fetch(getApiUrl('/contacts'), {
            method: 'POST',
            headers: fikenHeaders,
            body: JSON.stringify(customerData)
          });

          if (!createCustomerResponse.ok) {
            const errorText = await createCustomerResponse.text();
            throw new Error(`Failed to create customer: ${errorText}`);
          }

          fikenCustomer = await createCustomerResponse.json();
        }

        // Convert line items to Fiken format
        const fikenLines = lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price_excluding_vat: item.unit_price,
          vat_type: item.vat_type || 'HIGH',
          account_code: getAccountCodeForSourceType(item.source_type)
        }));

        // Create invoice
        const invoiceRequest = {
          customer_id: fikenCustomer.id,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: dueDate,
          invoice_text: projectReference ? `Project: ${projectReference}` : undefined,
          lines: fikenLines,
          send_method: null // Create as draft
        };

        const createInvoiceResponse = await fetch(getApiUrl('/invoices'), {
          method: 'POST',
          headers: fikenHeaders,
          body: JSON.stringify(invoiceRequest)
        });

        if (!createInvoiceResponse.ok) {
          const errorText = await createInvoiceResponse.text();
          throw new Error(`Failed to create invoice: ${errorText}`);
        }

        const invoiceResult = await createInvoiceResponse.json();
        
        result = {
          id: invoiceResult.id,
          invoice_number: invoiceResult.invoice_number,
          status: invoiceResult.status,
          edit_url: `https://fiken.no/${fikenCompanySlug}/invoices/${invoiceResult.id}`,
          total_amount: invoiceResult.total_amount,
          customer_id: fikenCustomer.id
        };
        break;

      case 'sync_status':
        if (!fikenInvoiceId) {
          throw new Error('Missing fikenInvoiceId for status sync');
        }

        const statusResponse = await fetch(getApiUrl(`/invoices/${fikenInvoiceId}`), {
          method: 'GET',
          headers: fikenHeaders
        });

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          throw new Error(`Failed to get invoice status: ${errorText}`);
        }

        const invoiceData = await statusResponse.json();
        
        result = {
          status: mapFikenStatusToLocal(invoiceData.status),
          sent_date: invoiceData.sent_date,
          paid_date: invoiceData.paid_date,
          total_amount: invoiceData.total_amount,
          fiken_status: invoiceData.status
        };
        break;

      case 'create_or_update_draft':
        if (!invoice_id || !customer_fiken_id || !total_amount || !due_date) {
          throw new Error('Missing required parameters for draft creation');
        }

        // Initialize Supabase client to get invoice line items
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

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

        // Convert line items to Fiken format
        const fikenDraftLines = invoiceLineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price_excluding_vat: item.unit_price,
          vat_type: item.vat_type || 'HIGH',
          account_code: getAccountCodeForSourceType(item.source_type)
        }));

        // Create draft invoice in Fiken
        const draftInvoiceRequest = {
          customer_id: customer_fiken_id,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: due_date,
          invoice_text: project_name ? `Project: ${project_name}` : undefined,
          lines: fikenDraftLines,
          send_method: null // Create as draft
        };

        const createDraftResponse = await fetch(getApiUrl('/invoices'), {
          method: 'POST',
          headers: fikenHeaders,
          body: JSON.stringify(draftInvoiceRequest)
        });

        if (!createDraftResponse.ok) {
          const errorText = await createDraftResponse.text();
          throw new Error(`Failed to create draft in Fiken: ${errorText}`);
        }

        const draftResult = await createDraftResponse.json();
        
        result = {
          success: true,
          fiken_invoice_id: draftResult.id,
          fiken_invoice_number: draftResult.invoice_number,
          fiken_url: `https://fiken.no/${fikenCompanySlug}/invoices/${draftResult.id}`,
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
function getAccountCodeForSourceType(sourceType: string): string | undefined {
  const mapping: Record<string, string> = {
    'event_crew': '3000', // Service revenue
    'event_equipment': '3100', // Equipment rental revenue
    'manual_expense': '3900', // Other revenue
    'fiken_added': '3900' // Other revenue
  };
  return mapping[sourceType];
}

function mapFikenStatusToLocal(fikenStatus: string): string {
  const mapping: Record<string, string> = {
    'DRAFT': 'created_in_fiken',
    'SENT': 'sent',
    'PAID': 'paid',
    'OVERDUE': 'overdue',
    'CANCELLED': 'cancelled'
  };
  return mapping[fikenStatus] || 'created_in_fiken';
}
