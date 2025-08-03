import { useMemo } from 'react';

// Type for owner options with avatar support
export interface OwnerOption {
  id: string;
  name: string;
  avatar_url?: string | null;
  email?: string;
}

// Type for projects with owner relationship
interface ProjectWithOwner {
  owner_id?: string;
  owner?: {
    id: string;
    name: string;
    avatar_url?: string | null;
    email?: string;
  } | null;
}

/**
 * Hook for extracting unique owner options from project data.
 * 
 * Eliminates duplicate owner extraction logic across Dashboard, Projects, and Planner components.
 * Supports both name-based deduplication (for UI) and id-based deduplication (for data integrity).
 * 
 * @param projects - Array of projects with owner relationships
 * @param options - Configuration options
 * @returns Sorted array of unique owner options
 * 
 * @example
 * ```tsx
 * // For Dashboard/Projects (name-based deduplication with avatars)
 * const ownerOptions = useOwnerOptions(projects, { includeAvatars: true });
 * 
 * // For Planner (id-based deduplication with emails)
 * const ownerOptions = useOwnerOptions(projects, { keyBy: 'id', includeEmails: true });
 * ```
 */
export function useOwnerOptions(
  projects: ProjectWithOwner[] | undefined,
  options: {
    keyBy?: 'name' | 'id';
    includeAvatars?: boolean;
    includeEmails?: boolean;
  } = {}
): OwnerOption[] {
  const { 
    keyBy = 'name', 
    includeAvatars = false, 
    includeEmails = false 
  } = options;

  return useMemo(() => {
    if (!projects) return [];
    
    const ownerMap = new Map<string, OwnerOption>();
    
    projects.forEach(project => {
      // Handle both direct owner_id and owner relationship
      const ownerId = project.owner_id || project.owner?.id;
      const ownerName = project.owner?.name;
      const ownerEmail = project.owner?.email;
      const avatarUrl = project.owner?.avatar_url;
      
      if (!ownerId || !ownerName) return;
      
      // Determine the deduplication key
      const mapKey = keyBy === 'name' ? ownerName : ownerId;
      
      // Skip if already processed (prevents duplicates)
      if (ownerMap.has(mapKey)) return;
      
      // Build the owner option object
      const ownerOption: OwnerOption = {
        id: ownerId,
        name: ownerName
      };
      
      // Conditionally include avatar and email
      if (includeAvatars && avatarUrl !== undefined) {
        ownerOption.avatar_url = avatarUrl;
      }
      
      if (includeEmails && ownerEmail) {
        ownerOption.email = ownerEmail;
      }
      
      ownerMap.set(mapKey, ownerOption);
    });
    
    // Return sorted by name for consistent ordering
    return Array.from(ownerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, keyBy, includeAvatars, includeEmails]);
}