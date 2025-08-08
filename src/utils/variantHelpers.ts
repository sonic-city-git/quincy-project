// Variant Helper Functions
// Utilities for working with project variants and events

import { supabase } from '@/integrations/supabase/client';
import { ProjectVariant } from '@/types/variants';

/**
 * Get the default variant for a project
 * Used when creating events without explicit variant selection
 */
export async function getDefaultVariantForProject(projectId: string): Promise<string> {
  const { data: variants, error } = await supabase
    .from('project_variants')
    .select('variant_name')
    .eq('project_id', projectId)
    .eq('is_default', true)
    .single();

  if (error || !variants) {
    console.warn('No default variant found for project:', projectId, 'using "default"');
    return 'default';
  }

  return variants.variant_name;
}

/**
 * Get all variants for a project
 */
export async function getProjectVariants(projectId: string): Promise<ProjectVariant[]> {
  const { data: variants, error } = await supabase
    .from('project_variants')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching variants:', error);
    return [];
  }

  return variants || [];
}

/**
 * Change an event's variant and re-sync equipment/crew
 * This is useful for switching an existing event to a different configuration
 */
export async function changeEventVariant(
  eventId: string, 
  projectId: string, 
  newVariantId: string
): Promise<void> {
  const { error } = await supabase.rpc('sync_event_variant', {
    p_event_id: eventId,
    p_project_id: projectId,
    p_variant_id: newVariantId
  });

  if (error) {
    console.error('Error changing event variant:', error);
    throw error;
  }
}

/**
 * Check if a project is an artist project (typically uses variants)
 * This can be used to show/hide variant selection UI
 */
export async function isArtistProject(projectId: string): Promise<boolean> {
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      project_types!inner(code)
    `)
    .eq('id', projectId)
    .single();

  if (error || !project) {
    return false;
  }

  return project.project_types?.code === 'artist';
}

// No longer needed - variant_name is used directly for display