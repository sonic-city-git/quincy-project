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

    // Get Fiken API configuration from Supabase secrets
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

      const fikenData = await fikenResponse.json();
      
      // Handle both array and paginated response formats
      if (Array.isArray(fikenData)) {
        // Direct array response - but still check for more pages
        allCustomers = allCustomers.concat(fikenData);
        console.log(`Fetched page ${page + 1}: ${fikenData.length} contacts`);
        
        // Continue fetching as long as we get data
        // Only stop if we get 0 results
        hasMore = fikenData.length > 0;
        page++;
        

        
        // Safety check to prevent infinite loops
        if (page > 100) {
          console.log('Safety limit reached: stopping at page 100');
          hasMore = false;
        }
      } else {
        // Paginated response object
        allCustomers = allCustomers.concat(fikenData.content || []);
        console.log(`Fetched page ${page + 1}/${fikenData.totalPages}: ${fikenData.content?.length || 0} contacts`);
        hasMore = page < fikenData.totalPages - 1;
        page++;
      }
    }

    console.log(`Fetched ${allCustomers.length} total customers from Fiken`);

    // Filter for active customers with customer numbers only (not suppliers or contacts without customer numbers)
    const activeCustomers = allCustomers.filter(contact => 
      !contact.inactive && 
      contact.customer === true && 
      contact.customerNumber != null
    );
    console.log(`Fetched ${allCustomers.length} total contacts, processing ${activeCustomers.length} active customers with customer numbers`);

    // Get all Fiken customer IDs that should exist (active customers with customer numbers)
    const validFikenIds = new Set(activeCustomers.map(customer => customer.contactId.toString()));
    console.log(`Valid Fiken customer IDs: ${validFikenIds.size}`);

    let syncedCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
    let deactivatedCount = 0;
    const errors: string[] = [];

    // Upsert customers to Supabase
    for (const customer of activeCustomers) {
      try {
        // Check if customer already exists by fiken_customer_id OR organization_number
        let existingCustomer = null;
        let fetchError = null;

        // First, try to find by fiken_customer_id
        const { data: fikenMatch, error: fikenError } = await supabaseClient
          .from('customers')
          .select('*')
          .eq('fiken_customer_id', customer.contactId)
          .maybeSingle();

        if (fikenError) {
          console.error('Error checking existing customer by Fiken ID:', fikenError);
          errors.push(`Failed to check customer ${customer.name}: ${fikenError.message}`);
          continue;
        }

        existingCustomer = fikenMatch;

        // If not found by Fiken ID and we have an organization number, try to find by org number
        if (!existingCustomer && customer.organizationNumber) {
          const { data: orgMatches, error: orgError } = await supabaseClient
            .from('customers')
            .select('*')
            .eq('organization_number', customer.organizationNumber);

          if (orgError) {
            console.error('Error checking existing customer by org number:', orgError);
            errors.push(`Failed to check customer ${customer.name} by org number: ${orgError.message}`);
            continue;
          }

          // If we found matches, use the first one (handle duplicates gracefully)
          if (orgMatches && orgMatches.length > 0) {
            existingCustomer = orgMatches[0];
            if (orgMatches.length > 1) {
              console.warn(`Found ${orgMatches.length} customers with org number ${customer.organizationNumber}, using first match`);
            }
          }
        }

        const customerData = {
          fiken_customer_id: customer.contactId.toString(),
          name: customer.name,
          email: customer.email || null,
          phone_number: customer.phoneNumber || null,
          customer_number: customer.customerNumber?.toString() || null,
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

    // Cleanup: Handle customers that are no longer valid in Fiken
    // (deactivated, deleted, or converted to suppliers)
    try {
      console.log('Checking for customers to deactivate...');
      
      // Find customers in our database that are no longer valid in Fiken
      const { data: customersToCheck, error: fetchError } = await supabaseClient
        .from('customers')
        .select('id, name, fiken_customer_id')
        .not('fiken_customer_id', 'is', null);

      if (fetchError) {
        console.error('Error fetching customers for cleanup:', fetchError);
        errors.push(`Cleanup error: ${fetchError.message}`);
      } else {
        // Check which customers are no longer valid
        const customersToDeactivate = customersToCheck.filter(customer => 
          !validFikenIds.has(customer.fiken_customer_id)
        );

        console.log(`Found ${customersToDeactivate.length} customers to delete`);

        // Delete customers that are no longer valid in Fiken
        if (customersToDeactivate.length > 0) {
          for (const customer of customersToDeactivate) {
            try {
              console.log(`Deleting customer no longer in Fiken: ${customer.name} (ID: ${customer.fiken_customer_id})`);
              
              // Check if customer is referenced by any projects
              const { data: referencingProjects, error: projectCheckError } = await supabaseClient
                .from('projects')
                .select('id, name')
                .eq('customer_id', customer.id);

              if (projectCheckError) {
                console.error(`Error checking projects for customer ${customer.name}:`, projectCheckError);
                errors.push(`Project check error for ${customer.name}: ${projectCheckError.message}`);
                continue;
              }

              if (referencingProjects && referencingProjects.length > 0) {
                console.warn(`Cannot delete customer ${customer.name}: referenced by ${referencingProjects.length} projects`);
                console.warn(`Projects: ${referencingProjects.map(p => p.name).join(', ')}`);
                errors.push(`Cannot delete ${customer.name}: referenced by ${referencingProjects.length} projects`);
                continue;
              }

              // Safe to delete - no project references
              const { error: deleteError } = await supabaseClient
                .from('customers')
                .delete()
                .eq('id', customer.id);

              if (deleteError) {
                console.error(`Error deleting customer ${customer.name}:`, deleteError);
                errors.push(`Delete error for ${customer.name}: ${deleteError.message}`);
              } else {
                console.log(`Successfully deleted customer: ${customer.name}`);
                deactivatedCount++;
              }
            } catch (customerError) {
              console.error(`Failed to process customer deletion ${customer.name}:`, customerError);
              errors.push(`Failed to delete ${customer.name}: ${customerError.message}`);
            }
          }
        }
      }
    } catch (cleanupError) {
      console.error('Cleanup process failed:', cleanupError);
      errors.push(`Cleanup failed: ${cleanupError.message}`);
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
        deleted: deactivatedCount,
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
