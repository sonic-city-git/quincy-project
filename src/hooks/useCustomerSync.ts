import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCustomerSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const syncCustomers = async () => {
    try {
      setIsSyncing(true);
  
      
      const { data, error } = await supabase.functions.invoke('sync-customers', {
        method: 'POST',
      });

      if (error) {
        console.error('Error syncing customers:', error);
        throw error;
      }

  

      toast.success("Customer sync completed successfully");

      return data;
    } catch (error) {
      console.error('Error syncing customers:', error);
      toast.error("Failed to sync customers");
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncCustomers, isSyncing };
};