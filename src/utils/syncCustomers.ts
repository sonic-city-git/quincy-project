import { supabase } from "@/integrations/supabase/client";

export async function syncCustomers() {
  console.log('Starting customer sync...');
  
  const { data, error } = await supabase.functions.invoke('sync-customers', {
    method: 'POST',
  });

  if (error) {
    console.error('Error syncing customers:', error);
    throw error;
  }

  console.log('Sync completed:', data);
  return data;
}