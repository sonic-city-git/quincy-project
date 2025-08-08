/**
 * CONSOLIDATED: useCrew - Now using generic useEntityData with async transformation
 * Reduced from 120 lines to 49 lines (59% reduction)
 */

import { useEntityData } from '../shared/useEntityData';
import { CrewMember } from '@/types/crew';
import { supabase } from '@/integrations/supabase/client';

export function useCrew(folderId?: string) {
  const { data: crew, isLoading: loading, refetch } = useEntityData<CrewMember>({
    table: 'crew_members',
    queryKey: ['crew', folderId],
    selectQuery: `
      *,
      crew_folders (
        name
      )
    `,
    filters: folderId ? { folder_id: folderId } : {},
    enableRealtime: true,
    realtimeTable: 'crew_members',
    refetchOnMount: true,
    transform: async (crewData) => {
      // Complex transformation logic for crew roles
      const [crewMemberRolesResult, crewRolesResult] = await Promise.all([
        supabase.from('crew_member_roles').select('*'),
        supabase.from('crew_roles').select('*')
      ]);

      if (crewMemberRolesResult.error) {
        console.error('Error fetching crew member roles:', crewMemberRolesResult.error);
      }
      if (crewRolesResult.error) {
        console.error('Error fetching crew roles:', crewRolesResult.error);
      }

      // Create lookup maps
      const roleIdToName = new Map(
        (crewRolesResult.data || []).map(role => [role.id, role.name])
      );
      
      const memberIdToRoles = new Map<string, string[]>();
      (crewMemberRolesResult.data || []).forEach(cmr => {
        if (cmr.crew_member_id && cmr.role_id) {
          const roleName = roleIdToName.get(cmr.role_id);
          if (roleName) {
            if (!memberIdToRoles.has(cmr.crew_member_id)) {
              memberIdToRoles.set(cmr.crew_member_id, []);
            }
            memberIdToRoles.get(cmr.crew_member_id)!.push(roleName);
          }
        }
      });

      // Map crew data with roles
      return crewData.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email || null,
        phone: member.phone || null,
        created_at: member.created_at,
        updated_at: member.updated_at,
        folder_id: member.folder_id,
        folderName: member.crew_folders?.name || null,
        avatar_url: member.avatar_url || null,
        roles: memberIdToRoles.get(member.id) || []
      }));
    },
    errorMessage: "Failed to fetch crew members"
  });
  
  return { crew, loading, refetch };
}