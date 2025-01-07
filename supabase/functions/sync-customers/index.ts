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

    // Tripletex API credentials
    const consumerToken = Deno.env.get('TRIPLETEX_CONSUMER_TOKEN')
    const employeeToken = Deno.env.get('TRIPLETEX_EMPLOYEE_TOKEN')

    if (!consumerToken || !employeeToken) {
      throw new Error('Missing Tripletex API credentials')
    }

    console.log('Fetching customers from Tripletex...')
    
    // Create session token by combining consumer and employee tokens
    const sessionToken = btoa(`${consumerToken}:${employeeToken}`)
    
    // Fetch customers from Tripletex with apikey both as URL parameter and header
    const tripletexResponse = await fetch(`https://api.tripletex.io/v2/customer?apikey=${consumerToken}`, {
      headers: {
        'Authorization': `Basic ${sessionToken}`,
        'Content-Type': 'application/json',
        'apikey': consumerToken
      },
    })

    if (!tripletexResponse.ok) {
      console.error('Tripletex API error:', await tripletexResponse.text())
      throw new Error('Failed to fetch customers from Tripletex')
    }

    const tripletexData = await tripletexResponse.json()
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