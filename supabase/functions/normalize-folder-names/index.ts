import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, get all folders
    const { data: folders, error: fetchError } = await supabase
      .from('folders')
      .select('*')

    if (fetchError) throw fetchError

    // Process each folder and update if needed
    const updates = folders.map(folder => {
      const normalizedName = folder.name.trim().replace(/\s+/g, '-')
      
      // Only include folders that need updating
      if (normalizedName !== folder.name) {
        return {
          id: folder.id,
          name: normalizedName,
          original_name: folder.name
        }
      }
      return null
    }).filter(Boolean)

    const results = {
      total_folders: folders.length,
      folders_updated: 0,
      updated_folders: []
    }

    // Update folders if needed
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('folders')
          .update({ name: update.name })
          .eq('id', update.id)

        if (updateError) throw updateError

        results.folders_updated++
        results.updated_folders.push({
          original: update.original_name,
          normalized: update.name
        })
      }
    }

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})