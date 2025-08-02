import { supabase } from "@/integrations/supabase/client";

/**
 * Sync crew member avatars from auth.users metadata
 * This function updates crew_members.avatar_url from the linked auth user's profile
 */
export const syncCrewAvatars = async () => {
  console.log('Starting crew avatar sync...');
  
  try {
    // Get all crew members with auth_id but missing avatar_url
    const { data: crewMembers, error: crewError } = await supabase
      .from('crew_members')
      .select('id, name, auth_id, avatar_url, email')
      .not('auth_id', 'is', null);

    if (crewError) {
      console.error('Error fetching crew members:', crewError);
      throw crewError;
    }

    if (!crewMembers?.length) {
      console.log('No crew members with auth_id found');
      return { updated: 0, total: 0 };
    }

    console.log(`Found ${crewMembers.length} crew members with auth_id`);
    
    let updatedCount = 0;
    const updates = [];

    // For each crew member with auth_id, get their avatar from auth.users
    for (const member of crewMembers) {
      try {
        // Get the auth user data (this uses the admin client)
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(member.auth_id);
        
        if (authError) {
          console.warn(`Could not fetch auth user for ${member.name}:`, authError);
          continue;
        }

        if (!authUser.user) {
          console.warn(`No auth user found for ${member.name} with auth_id: ${member.auth_id}`);
          continue;
        }

        // Extract avatar URL from user metadata or identities
        let avatarUrl = null;
        
        // Try user_metadata first (Google profile picture)
        if (authUser.user.user_metadata?.avatar_url) {
          avatarUrl = authUser.user.user_metadata.avatar_url;
        }
        // Try identities for Google provider
        else if (authUser.user.identities) {
          const googleIdentity = authUser.user.identities.find(identity => identity.provider === 'google');
          if (googleIdentity?.identity_data?.avatar_url) {
            avatarUrl = googleIdentity.identity_data.avatar_url;
          }
        }

        // Only update if we found an avatar and it's different from current
        if (avatarUrl && avatarUrl !== member.avatar_url) {
          updates.push({
            id: member.id,
            avatar_url: avatarUrl,
            name: member.name
          });
        }
      } catch (error) {
        console.warn(`Error processing crew member ${member.name}:`, error);
        continue;
      }
    }

    // Batch update crew members with new avatars
    if (updates.length > 0) {
      console.log(`Updating ${updates.length} crew member avatars...`);
      
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('crew_members')
          .update({ avatar_url: update.avatar_url })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating avatar for ${update.name}:`, updateError);
        } else {
          console.log(`✅ Updated avatar for ${update.name}`);
          updatedCount++;
        }
      }
    }

    console.log(`Crew avatar sync complete. Updated ${updatedCount} of ${crewMembers.length} crew members.`);
    return { updated: updatedCount, total: crewMembers.length };

  } catch (error) {
    console.error('Error in syncCrewAvatars:', error);
    throw error;
  }
};

/**
 * Sync a single crew member's avatar by email
 * Useful when you know a specific crew member needs their avatar updated
 */
export const syncCrewMemberAvatar = async (email: string) => {
  console.log(`Syncing avatar for crew member with email: ${email}`);
  
  try {
    // Find crew member by email
    const { data: crewMember, error: crewError } = await supabase
      .from('crew_members')
      .select('id, name, auth_id, avatar_url')
      .eq('email', email)
      .single();

    if (crewError) {
      console.error('Error finding crew member:', crewError);
      throw crewError;
    }

    if (!crewMember.auth_id) {
      console.log('Crew member has no linked auth_id');
      return false;
    }

    // Get auth user data
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(crewMember.auth_id);
    
    if (authError || !authUser.user) {
      console.error('Error fetching auth user:', authError);
      return false;
    }

    // Extract avatar URL
    let avatarUrl = null;
    if (authUser.user.user_metadata?.avatar_url) {
      avatarUrl = authUser.user.user_metadata.avatar_url;
    } else if (authUser.user.identities) {
      const googleIdentity = authUser.user.identities.find(identity => identity.provider === 'google');
      if (googleIdentity?.identity_data?.avatar_url) {
        avatarUrl = googleIdentity.identity_data.avatar_url;
      }
    }

    if (!avatarUrl) {
      console.log('No avatar URL found for user');
      return false;
    }

    // Update crew member
    const { error: updateError } = await supabase
      .from('crew_members')
      .update({ avatar_url: avatarUrl })
      .eq('id', crewMember.id);

    if (updateError) {
      console.error('Error updating crew member avatar:', updateError);
      return false;
    }

    console.log(`✅ Successfully updated avatar for ${crewMember.name}`);
    return true;

  } catch (error) {
    console.error('Error in syncCrewMemberAvatar:', error);
    throw error;
  }
};