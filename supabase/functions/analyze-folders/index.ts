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

    // Get all unique folder names from equipment table
    const { data: equipmentFolders, error: equipmentError } = await supabase
      .from('equipment')
      .select('Folder')
      .not('Folder', 'is', null)
      .not('Folder', 'eq', '')

    if (equipmentError) throw equipmentError

    // Get all existing folder names
    const { data: existingFolders, error: foldersError } = await supabase
      .from('folders')
      .select('name')

    if (foldersError) throw foldersError

    // Create sets for comparison
    const equipmentFolderSet = new Set(
      equipmentFolders
        .map(e => e.Folder?.toLowerCase().trim())
        .filter(Boolean)
    )
    const existingFolderSet = new Set(
      existingFolders
        .map(f => f.name.toLowerCase().trim())
    )

    // Find missing folders
    const missingFolders = Array.from(equipmentFolderSet)
      .filter(folder => !existingFolderSet.has(folder))
      .map(folder => ({
        original: equipmentFolders.find(
          e => e.Folder?.toLowerCase().trim() === folder
        )?.Folder,
        normalized: folder
      }))

    return new Response(
      JSON.stringify({
        missingFolders,
        totalEquipmentFolders: equipmentFolderSet.size,
        totalExistingFolders: existingFolderSet.size
      }),
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