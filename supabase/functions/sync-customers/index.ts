import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting customer sync process...')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Construct the authorization string
    const companyId = '0'
    const sessionToken = 'eyJ0b2tlbklkIjo1NzU3NzQ0OTIsInRva2VuIjoiMTI3MWVhNWItNmRjZC00MjU0LWE5OGEtOTdmZmRkYzc4ZGZjIn0'
    const authString = `${companyId}:${sessionToken}`
    
    // Encode to base64
    const encoder = new TextEncoder()
    const data = encoder.encode(authString)
    const base64Auth = btoa(String.fromCharCode(...new Uint8Array(data)))
    
    const headers = {
      'Authorization': `Basic ${base64Auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    
    console.log('Making request to Tripletex API with auth:', base64Auth)
    
    const tripletexResponse = await fetch(
      'https://tripletex.no/v2/customer?fields=id,name,email,phoneNumber,customerNumber', 
      {
        method: 'GET',
        headers: headers
      }
    )

    if (!tripletexResponse.ok) {
      const errorText = await tripletexResponse.text()
      console.error('Tripletex API error:', errorText)
      throw new Error(`Failed to fetch customers from Tripletex (${tripletexResponse.status}): ${errorText}`)
    }

    const tripletexData = await tripletexResponse.json()
    const customers: TripletexCustomer[] = tripletexData.values || []

    console.log(`Fetched ${customers.length} customers from Tripletex`)

    // Upsert customers to Supabase
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