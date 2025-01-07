import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCustomerSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const syncCustomers = async () => {
    try {
      setIsSyncing(true);
      console.log('Starting customer sync...');
      
      const { data, error } = await supabase.functions.invoke('sync-customers', {
        method: 'POST',
      });

      if (error) {
        console.error('Error syncing customers:', error);
        throw error;
      }

      console.log('Sync completed:', data);

      toast({
        title: "Success",
        description: "Customer sync completed successfully",
      });

      return data;
    } catch (error) {
      console.error('Error syncing customers:', error);
      toast({
        title: "Error",
        description: "Failed to sync customers",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncCustomers, isSyncing };
};