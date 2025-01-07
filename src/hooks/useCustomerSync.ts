import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCustomerSync = () => {
  const { toast } = useToast();

  const syncCustomers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-customers', {
        method: 'POST',
        headers: {
          Authorization: `Basic MDpleUowYjJ0bGJrbGtJam8xTnpVM056UTBPVElzSW5SdmEyVnVJam9pTVRJM01XVmhOV0l0Tm1SalpDMDBNalUwTFdFNU9HRXRPVGRtWm1Sa1l6YzRaR1pqSW4w`,
          'apikey': process.env.SUPABASE_ANON_KEY,
        },
        body: { action: 'sync' }
      });

      if (error) throw error;

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
    }
  };

  return { syncCustomers };
};