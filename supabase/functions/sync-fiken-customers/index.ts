import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FikenCustomer {
  contactId: string;
  name: string;
  email?: string;
  phone?: string;
  organizationNumber?: string;
  customerNumber?: string;
  address?: {
    address1?: string;
    address2?: string;
    city?: string;
    postCode?: string;
    country?: string;
  };
  inactive?: boolean;
  createdDate?: string;
  lastModifiedDate?: string;
}

interface FikenCustomersResponse {
  content: FikenCustomer[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting Fiken customer sync process...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Fiken API configuration from environment
    const fikenApiKey = Deno.env.get('FIKEN_API_KEY');
    const fikenCompanySlug = Deno.env.get('FIKEN_COMPANY_SLUG');
    const fikenBaseUrl = Deno.env.get('FIKEN_API_BASE_URL') || 'https://api.fiken.no/api/v2';

    if (!fikenApiKey || !fikenCompanySlug) {
      throw new Error('Fiken API credentials not configured');
    }

    const fikenHeaders = {
      'Authorization': `Bearer ${fikenApiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const getApiUrl = (endpoint: string) => `${fikenBaseUrl}/companies/${fikenCompanySlug}${endpoint}`;

    console.log('Fetching customers from Fiken API...')

    // Fetch all customers from Fiken (with pagination)
    let allCustomers: FikenCustomer[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const fikenResponse = await fetch(
        getApiUrl(`/contacts?page=${page}&size=100`),
        {
          method: 'GET',
          headers: fikenHeaders
        }
      );

      if (!fikenResponse.ok) {
        const errorText = await fikenResponse.text();
        console.error('Fiken API error:', errorText);
        throw new Error(`Failed to fetch customers from Fiken (${fikenResponse.status}): ${errorText}`);
      }

      const fikenData: FikenCustomersResponse = await fikenResponse.json();
      allCustomers = allCustomers.concat(fikenData.content || []);
      
      console.log(`Fetched page ${page + 1}/${fikenData.totalPages}, ${fikenData.content?.length || 0} customers`);
      
      hasMore = page < fikenData.totalPages - 1;
      page++;
    }

    console.log(`Fetched ${allCustomers.length} total customers from Fiken`);

    // Filter out inactive customers if desired
    const activeCustomers = allCustomers.filter(customer => !customer.inactive);
    console.log(`Processing ${activeCustomers.length} active customers`);

    let syncedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
    const errors: string[] = [];

    // Upsert customers to Supabase
    for (const customer of activeCustomers) {
      try {
        // Check if customer already exists by fiken_customer_id
        const { data: existingCustomer, error: fetchError } = await supabaseClient
          .from('customers')
          .select('*')
          .eq('fiken_customer_id', customer.contactId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking existing customer:', fetchError);
          errors.push(`Failed to check customer ${customer.name}: ${fetchError.message}`);
          continue;
        }

        const customerData = {
          fiken_customer_id: customer.contactId,
          name: customer.name,
          email: customer.email || null,
          phone_number: customer.phone || null,
          customer_number: customer.customerNumber || null,
          organization_number: customer.organizationNumber || null,
        };

        if (existingCustomer) {
          // Update existing customer
          const { error: updateError } = await supabaseClient
            .from('customers')
            .update(customerData)
            .eq('id', existingCustomer.id);

          if (updateError) {
            console.error('Error updating customer:', updateError);
            errors.push(`Failed to update customer ${customer.name}: ${updateError.message}`);
          } else {
            updatedCount++;
            syncedCount++;
          }
        } else {
          // Create new customer
          const { error: insertError } = await supabaseClient
            .from('customers')
            .insert(customerData);

          if (insertError) {
            console.error('Error creating customer:', insertError);
            errors.push(`Failed to create customer ${customer.name}: ${insertError.message}`);
          } else {
            createdCount++;
            syncedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing customer ${customer.name}:`, error);
        errors.push(`Failed to process customer ${customer.name}: ${error.message}`);
      }
    }

    const result = {
      success: true,
      message: `Successfully synced ${syncedCount} customers from Fiken`,
      details: {
        totalFetched: allCustomers.length,
        activeCustomers: activeCustomers.length,
        synced: syncedCount,
        created: createdCount,
        updated: updatedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Sync completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in sync-fiken-customers function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to sync customers from Fiken'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
