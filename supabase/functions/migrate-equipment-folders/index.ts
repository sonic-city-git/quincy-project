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

    // First, get all equipment items
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, Folder')

    if (equipmentError) throw equipmentError

    // Get all folders
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('id, name, parent_id')

    if (foldersError) throw foldersError

    // Create a map of folder names to IDs
    const folderMap = new Map()
    folders.forEach(folder => {
      folderMap.set(folder.name.toLowerCase(), folder.id)
    })

    // Function to find folder ID based on old folder path
    const findFolderId = (folderPath: string) => {
      if (!folderPath) return null
      
      // Clean and normalize the folder path
      const cleanPath = folderPath.toLowerCase().trim()
      
      // Direct mapping for main categories
      if (folderMap.has(cleanPath)) {
        return folderMap.get(cleanPath)
      }

      // Handle special cases and common variations
      const specialCases: { [key: string]: string } = {
        'mixrack': 'mixers',
        'surface': 'mixers',
        'expansion': 'mixers',
        'small-format': 'mixers',
        'dynamic': 'microphones',
        'condenser': 'microphones',
        'ribbon': 'microphones',
        'shotgun': 'microphones',
        'wl-capsule': 'microphones',
        'special-misc': 'microphones',
        'active': 'di-boxes',
        'passive': 'di-boxes',
        'special': 'di-boxes',
        'cat': 'cables',
        'xlr': 'cables',
        'lk37-sb': 'cables',
        'jack': 'cables',
        'coax': 'cables',
        'fibre': 'cables',
        'schuko': 'cables'
      }

      // Check if it's a known subfolder
      for (const [sub, main] of Object.entries(specialCases)) {
        if (cleanPath.includes(sub)) {
          return folderMap.get(main)
        }
      }

      // If no match found, return null
      return null
    }

    // Process each equipment item
    const updates = equipment.map(item => ({
      id: item.id,
      folder_id: findFolderId(item.Folder)
    })).filter(update => update.folder_id !== null)

    // Update equipment records in batches
    const batchSize = 100
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      const { error: updateError } = await supabase
        .from('equipment')
        .upsert(batch)

      if (updateError) throw updateError
    }

    return new Response(
      JSON.stringify({ 
        message: 'Migration completed successfully',
        processed: equipment.length,
        updated: updates.length
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