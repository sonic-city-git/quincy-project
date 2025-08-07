// Utility to copy equipment between variants
import { supabase } from '@/integrations/supabase/client';

export async function copyEquipmentBetweenVariants(
  projectId: string,
  fromVariant: string,
  toVariant: string
): Promise<{ success: boolean; error?: string; copiedCount: number }> {
  try {
    console.log(`🔄 Copying equipment from '${fromVariant}' to '${toVariant}'...`);

    // First, copy equipment groups
    const { data: sourceGroups, error: groupsError } = await supabase
      .from('project_equipment_groups')
      .select('*')
      .eq('project_id', projectId)
      .eq('variant_name', fromVariant);

    if (groupsError) {
      throw new Error(`Failed to fetch source groups: ${groupsError.message}`);
    }

    // Map to store old group ID -> new group ID
    const groupIdMap = new Map<string, string>();

    // Copy groups to new variant
    for (const group of sourceGroups || []) {
      // Check if group already exists in target variant
      const { data: existingGroup } = await supabase
        .from('project_equipment_groups')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', toVariant)
        .eq('name', group.name)
        .single();

      if (existingGroup) {
        groupIdMap.set(group.id, existingGroup.id);
      } else {
        // Create new group
        const { data: newGroup, error: createGroupError } = await supabase
          .from('project_equipment_groups')
          .insert({
            project_id: projectId,
            name: group.name,
            variant_name: toVariant,
            sort_order: group.sort_order,
            total_price: group.total_price
          })
          .select('id')
          .single();

        if (createGroupError) {
          throw new Error(`Failed to create group: ${createGroupError.message}`);
        }

        groupIdMap.set(group.id, newGroup.id);
      }
    }

    // Now copy equipment items
    const { data: sourceEquipment, error: equipmentError } = await supabase
      .from('project_equipment')
      .select('*')
      .eq('project_id', projectId)
      .eq('variant_name', fromVariant);

    if (equipmentError) {
      throw new Error(`Failed to fetch source equipment: ${equipmentError.message}`);
    }

    let copiedCount = 0;

    for (const equipment of sourceEquipment || []) {
      // Check if equipment already exists in target variant
      const { data: existingEquipment } = await supabase
        .from('project_equipment')
        .select('id')
        .eq('project_id', projectId)
        .eq('variant_name', toVariant)
        .eq('equipment_id', equipment.equipment_id)
        .single();

      if (!existingEquipment) {
        // Copy equipment to new variant
        const { error: copyError } = await supabase
          .from('project_equipment')
          .insert({
            project_id: projectId,
            equipment_id: equipment.equipment_id,
            variant_name: toVariant,
            quantity: equipment.quantity,
            group_id: equipment.group_id ? groupIdMap.get(equipment.group_id) : null,
            notes: equipment.notes
          });

        if (copyError) {
          console.error('Failed to copy equipment item:', equipment.equipment_id, copyError);
        } else {
          copiedCount++;
        }
      }
    }

    console.log(`✅ Successfully copied ${copiedCount} equipment items to '${toVariant}' variant`);
    
    return { success: true, copiedCount };
  } catch (error: any) {
    console.error('❌ Error copying equipment between variants:', error);
    return { success: false, error: error.message, copiedCount: 0 };
  }
}