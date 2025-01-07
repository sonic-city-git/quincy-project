import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TripletexCustomer {
  id: number;
  name: string;
  email?: string;
  phoneNumber?: string;
  customerNumber?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting customer sync process...')
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the Tripletex tokens from Supabase secrets
    const sessionToken = "MDpleUowYjJ0bGJrbGtJam8xTnpVM056UTBPVElzSW5SdmEyVnVJam9pTVRJM01XVmhOV0l0Tm1SalpDMDBNalUwTFdFNU9HRXRPVGRtWm1Sa1l6YzRaR1pqSW4w"
    const consumerToken = Deno.env.get('TRIPLETEX_CONSUMER_TOKEN')
    
    if (!sessionToken || !consumerToken) {
      throw new Error('Tripletex tokens not found in environment variables')
    }

    console.log('Fetching customers from Tripletex...')
    
    // Create base64 encoded auth string
    const authString = new TextEncoder().encode('0:' + sessionToken);
    const base64Auth = base64Encode(authString);
    
    const headers = {
      'Authorization': `Basic ${base64Auth}`,
      'consumerToken': consumerToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    
    console.log('Making request to Tripletex API with headers:', JSON.stringify({
      ...headers,
      'Authorization': 'Basic [REDACTED]' // Don't log the full auth token
    }, null, 2))
    
    // Fetch customers from Tripletex
    const tripletexResponse = await fetch('https://api.tripletex.io/v2/customer?fields=id,name,email,phoneNumber,customerNumber', {
      method: 'GET',
      headers: headers
    })

    if (!tripletexResponse.ok) {
      const errorText = await tripletexResponse.text()
      console.error('Tripletex API error:', errorText)
      throw new Error(`Failed to fetch customers from Tripletex (${tripletexResponse.status}): ${errorText}`)
    }

    const tripletexData = await tripletexResponse.json()
    console.log('Tripletex API response:', JSON.stringify(tripletexData, null, 2))
    
    const customers: TripletexCustomer[] = tripletexData.values || []

    console.log(`Fetched ${customers.length} customers from Tripletex`)

    // Upsert customers to our database
    for (const customer of customers) {
      const { error } = await supabaseClient
        .from('customers')
        .upsert({
          tripletex_id: customer.id,
          name: customer.name,
          email: customer.email,
          phone_number: customer.phoneNumber,
          customer_number: customer.customerNumber,
        }, {
          onConflict: 'tripletex_id'
        })

      if (error) {
        console.error('Error upserting customer:', error)
        throw error
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${customers.length} customers` 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Error in sync-customers function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})