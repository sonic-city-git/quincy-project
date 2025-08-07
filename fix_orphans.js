#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read project config
const configPath = './supabase/config.toml';
let projectId = 'dlspsnjhpmzwxfjajsoa'; // fallback

if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  const match = config.match(/project_id\s*=\s*["']([^"']+)["']/);
  if (match) {
    projectId = match[1];
  }
}

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrphanedRecords() {
  console.log('🔧 Fixing orphaned records in QUINCY database...\n');

  try {
    // Step 1: Get all projects and their first variants
    const { data: variants, error: variantsError } = await supabase
      .from('project_variants')
      .select('id, project_id, variant_name, created_at')
      .order('created_at', { ascending: true });

    if (variantsError) {
      throw new Error(`Failed to fetch variants: ${variantsError.message}`);
    }

    // Group variants by project to find the first variant for each project
    const projectVariantMap = new Map();
    variants.forEach(variant => {
      if (!projectVariantMap.has(variant.project_id)) {
        projectVariantMap.set(variant.project_id, variant);
      }
    });

    console.log(`📋 Found ${projectVariantMap.size} projects with variants`);

    // Step 2: Fix orphaned equipment records
    const { data: orphanedEquipment } = await supabase
      .from('project_equipment')
      .select('id, project_id')
      .is('variant_id', null);

    if (orphanedEquipment && orphanedEquipment.length > 0) {
      console.log(`\n🔧 Fixing ${orphanedEquipment.length} orphaned equipment records...`);
      
      let fixedEquipment = 0;
      for (const equipment of orphanedEquipment) {
        const firstVariant = projectVariantMap.get(equipment.project_id);
        if (firstVariant) {
          const { error: updateError } = await supabase
            .from('project_equipment')
            .update({ variant_id: firstVariant.id })
            .eq('id', equipment.id);
          
          if (!updateError) {
            fixedEquipment++;
          } else {
            console.error(`Failed to fix equipment ${equipment.id}:`, updateError);
          }
        } else {
          console.warn(`No variant found for project ${equipment.project_id}, skipping equipment ${equipment.id}`);
        }
      }
      console.log(`✅ Fixed ${fixedEquipment}/${orphanedEquipment.length} equipment records`);
    } else {
      console.log('✅ No orphaned equipment records found');
    }

    // Step 3: Fix orphaned equipment groups
    const { data: orphanedGroups } = await supabase
      .from('project_equipment_groups')
      .select('id, project_id, name')
      .is('variant_id', null);

    if (orphanedGroups && orphanedGroups.length > 0) {
      console.log(`\n🔧 Fixing ${orphanedGroups.length} orphaned group records...`);
      
      let fixedGroups = 0;
      for (const group of orphanedGroups) {
        const firstVariant = projectVariantMap.get(group.project_id);
        if (firstVariant) {
          const { error: updateError } = await supabase
            .from('project_equipment_groups')
            .update({ variant_id: firstVariant.id })
            .eq('id', group.id);
          
          if (!updateError) {
            fixedGroups++;
            console.log(`   ✅ Fixed group "${group.name}" -> linked to variant "${firstVariant.variant_name}"`);
          } else {
            console.error(`Failed to fix group ${group.id}:`, updateError);
          }
        } else {
          console.warn(`No variant found for project ${group.project_id}, skipping group ${group.id}`);
        }
      }
      console.log(`✅ Fixed ${fixedGroups}/${orphanedGroups.length} group records`);
    } else {
      console.log('✅ No orphaned group records found');
    }

    // Step 4: Verify the fix
    console.log('\n🔍 Verifying fixes...');
    
    const { data: remainingOrphanedEquipment } = await supabase
      .from('project_equipment')
      .select('id')
      .is('variant_id', null);

    const { data: remainingOrphanedGroups } = await supabase
      .from('project_equipment_groups')
      .select('id')
      .is('variant_id', null);

    console.log(`📦 Remaining orphaned equipment: ${remainingOrphanedEquipment?.length || 0}`);
    console.log(`📁 Remaining orphaned groups: ${remainingOrphanedGroups?.length || 0}`);

    if ((remainingOrphanedEquipment?.length || 0) === 0 && (remainingOrphanedGroups?.length || 0) === 0) {
      console.log('\n🎉 All orphaned records have been successfully fixed!');
      console.log('✅ Your variant system is now fully consistent!');
    } else {
      console.log('\n⚠️  Some orphaned records remain (likely projects without variants)');
    }

  } catch (error) {
    console.error('❌ Error fixing orphaned records:', error);
  }
}

fixOrphanedRecords();