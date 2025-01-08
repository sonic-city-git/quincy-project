import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Delete all equipment items with "Sale" in Rental/sales column
    const { data, error } = await supabaseClient
      .from('equipment')
      .delete()
      .eq('Rental/sales', 'Sale')
      .select()

    if (error) {
      console.error('Error deleting sales equipment:', error)
      throw error
    }

    console.log(`Successfully deleted ${data?.length ?? 0} sales equipment items`)

    return new Response(
      JSON.stringify({
        message: `Successfully deleted ${data?.length ?? 0} sales equipment items`,
        deletedItems: data
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Expose-Headers': 'Content-Length, X-JSON',
        },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Expose-Headers': 'Content-Length, X-JSON',
        },
      }
    )
  }
})