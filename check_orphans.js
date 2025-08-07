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

// You'll need to set your SUPABASE_SERVICE_ROLE_KEY environment variable
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable');
  console.error('Set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrphanedRecords() {
  console.log('🔍 Checking for orphaned records in QUINCY database...\n');

  try {
    // Check 1: Equipment missing variant
    const { data: orphanedEquipment, error: equipmentError } = await supabase.rpc('check_orphaned_equipment');
    
    if (equipmentError) {
      // If RPC doesn't exist, use direct queries
      console.log('📊 Running direct SQL queries...\n');
      
      // Equipment with NULL or invalid variant_id
      const { data: equipment1, error: eq1Error } = await supabase
        .from('project_equipment')
        .select(`
          id,
          project_id,
          variant_id,
          equipment_id,
          equipment:equipment_id (name)
        `)
        .is('variant_id', null);
      
      if (eq1Error) {
        console.error('Error checking equipment with NULL variant_id:', eq1Error);
      } else {
        console.log(`📦 Equipment with NULL variant_id: ${equipment1?.length || 0}`);
        if (equipment1?.length > 0) {
          console.log('   Sample records:', equipment1.slice(0, 3));
        }
      }

      // Equipment with invalid variant_id (variant doesn't exist)
      const { data: equipment2, error: eq2Error } = await supabase
        .from('project_equipment')
        .select(`
          id,
          project_id,
          variant_id,
          equipment_id,
          equipment:equipment_id (name)
        `)
        .not('variant_id', 'is', null);
      
      if (!eq2Error && equipment2) {
        // Check which variants actually exist
        const variantIds = [...new Set(equipment2.map(e => e.variant_id))];
        const { data: existingVariants } = await supabase
          .from('project_variants')
          .select('id')
          .in('id', variantIds);
        
        const existingVariantIds = new Set(existingVariants?.map(v => v.id) || []);
        const invalidEquipment = equipment2.filter(e => !existingVariantIds.has(e.variant_id));
        
        console.log(`📦 Equipment with invalid variant_id: ${invalidEquipment.length}`);
        if (invalidEquipment.length > 0) {
          console.log('   Sample records:', invalidEquipment.slice(0, 3));
        }
      }

      // Equipment groups with NULL variant_id
      const { data: groups1, error: gr1Error } = await supabase
        .from('project_equipment_groups')
        .select('id, project_id, name, variant_id')
        .is('variant_id', null);
      
      if (gr1Error) {
        console.error('Error checking groups with NULL variant_id:', gr1Error);
      } else {
        console.log(`📁 Groups with NULL variant_id: ${groups1?.length || 0}`);
        if (groups1?.length > 0) {
          console.log('   Sample records:', groups1.slice(0, 3));
        }
      }

      // Equipment groups with invalid variant_id
      const { data: groups2, error: gr2Error } = await supabase
        .from('project_equipment_groups')
        .select('id, project_id, name, variant_id')
        .not('variant_id', 'is', null);
      
      if (!gr2Error && groups2) {
        const variantIds = [...new Set(groups2.map(g => g.variant_id))];
        const { data: existingVariants } = await supabase
          .from('project_variants')
          .select('id')
          .in('id', variantIds);
        
        const existingVariantIds = new Set(existingVariants?.map(v => v.id) || []);
        const invalidGroups = groups2.filter(g => !existingVariantIds.has(g.variant_id));
        
        console.log(`📁 Groups with invalid variant_id: ${invalidGroups.length}`);
        if (invalidGroups.length > 0) {
          console.log('   Sample records:', invalidGroups.slice(0, 3));
        }
      }

      // Equipment with invalid group_id
      const { data: equipment3, error: eq3Error } = await supabase
        .from('project_equipment')
        .select(`
          id,
          project_id,
          group_id,
          equipment_id,
          equipment:equipment_id (name)
        `)
        .not('group_id', 'is', null);
      
      if (!eq3Error && equipment3) {
        const groupIds = [...new Set(equipment3.map(e => e.group_id))];
        const { data: existingGroups } = await supabase
          .from('project_equipment_groups')
          .select('id')
          .in('id', groupIds);
        
        const existingGroupIds = new Set(existingGroups?.map(g => g.id) || []);
        const invalidGroupEquipment = equipment3.filter(e => !existingGroupIds.has(e.group_id));
        
        console.log(`📦 Equipment with invalid group_id: ${invalidGroupEquipment.length}`);
        if (invalidGroupEquipment.length > 0) {
          console.log('   Sample records:', invalidGroupEquipment.slice(0, 3));
        }
      }

      console.log('\n✅ Orphaned records check complete!');
      console.log('\n💡 To fix these issues, run the fix_orphaned_records.sql script in your Supabase dashboard');
      
    } else {
      console.log('✅ RPC function worked:', orphanedEquipment);
    }

  } catch (error) {
    console.error('❌ Error checking orphaned records:', error);
  }
}

checkOrphanedRecords();