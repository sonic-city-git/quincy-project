import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting folder name normalization...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, get all folders
    const { data: folders, error: fetchError } = await supabase
      .from('folders')
      .select('*')

    if (fetchError) {
      console.error('Error fetching folders:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${folders.length} folders to process`);

    // Process each folder and update if needed
    const updates = folders.map(folder => {
      const normalizedName = folder.name.trim().replace(/\s+/g, '');
      
      // Only include folders that need updating
      if (normalizedName !== folder.name) {
        return {
          id: folder.id,
          name: normalizedName,
          original_name: folder.name
        }
      }
      return null;
    }).filter(Boolean);

    console.log(`Found ${updates.length} folders that need normalization`);

    const results = {
      total_folders: folders.length,
      folders_updated: 0,
      updated_folders: []
    }

    // Update folders if needed
    if (updates.length > 0) {
      for (const update of updates) {
        console.log(`Updating folder: ${update.original_name} -> ${update.name}`);
        
        const { error: updateError } = await supabase
          .from('folders')
          .update({ name: update.name })
          .eq('id', update.id)

        if (updateError) {
          console.error('Error updating folder:', updateError);
          throw updateError;
        }

        results.folders_updated++;
        results.updated_folders.push({
          original: update.original_name,
          normalized: update.name
        })
      }
    }

    console.log('Normalization complete:', results);

    return new Response(
      JSON.stringify(results),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in normalize-folder-names function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})