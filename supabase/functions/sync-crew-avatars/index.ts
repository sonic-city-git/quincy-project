import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email } = await req.json()
    
    console.log('Starting crew avatar sync...', email ? `for ${email}` : 'for all crew members')

    // Get crew members with auth_id
    let query = supabaseAdmin
      .from('crew_members')
      .select('id, name, auth_id, avatar_url, email')
      .not('auth_id', 'is', null)

    // If specific email provided, filter to that member
    if (email) {
      query = query.eq('email', email)
    }

    const { data: crewMembers, error: crewError } = await query

    if (crewError) {
      console.error('Error fetching crew members:', crewError)
      throw crewError
    }

    if (!crewMembers?.length) {
      console.log('No crew members with auth_id found')
      return new Response(
        JSON.stringify({ updated: 0, total: 0, message: 'No crew members found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Found ${crewMembers.length} crew members with auth_id`)
    
    let updatedCount = 0
    const updates = []

    // Process each crew member
    for (const member of crewMembers) {
      try {
        // Get the auth user data using admin client
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(member.auth_id)
        
        if (authError || !authUser.user) {
          console.warn(`Could not fetch auth user for ${member.name}:`, authError)
          continue
        }

        // Extract avatar URL from user metadata or identities
        let avatarUrl = null
        
        // Try user_metadata first (Google profile picture)
        if (authUser.user.user_metadata?.avatar_url) {
          avatarUrl = authUser.user.user_metadata.avatar_url
        }
        // Try identities for Google provider
        else if (authUser.user.identities) {
          const googleIdentity = authUser.user.identities.find(identity => identity.provider === 'google')
          if (googleIdentity?.identity_data?.avatar_url) {
            avatarUrl = googleIdentity.identity_data.avatar_url
          }
        }

        // Only update if we found an avatar and it's different from current
        if (avatarUrl && avatarUrl !== member.avatar_url) {
          updates.push({
            id: member.id,
            avatar_url: avatarUrl,
            name: member.name
          })
        } else if (avatarUrl === member.avatar_url) {
          console.log(`Avatar already up to date for ${member.name}`)
        } else {
          console.log(`No avatar found for ${member.name}`)
        }
      } catch (error) {
        console.warn(`Error processing crew member ${member.name}:`, error)
        continue
      }
    }

    // Batch update crew members with new avatars
    if (updates.length > 0) {
      console.log(`Updating ${updates.length} crew member avatars...`)
      
      for (const update of updates) {
        const { error: updateError } = await supabaseAdmin
          .from('crew_members')
          .update({ 
            avatar_url: update.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)

        if (updateError) {
          console.error(`Error updating avatar for ${update.name}:`, updateError)
        } else {
          console.log(`✅ Updated avatar for ${update.name}`)
          updatedCount++
        }
      }
    }

    const result = {
      updated: updatedCount,
      total: crewMembers.length,
      message: `Updated ${updatedCount} of ${crewMembers.length} crew member avatars`
    }

    console.log('Crew avatar sync complete:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in sync-crew-avatars function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})