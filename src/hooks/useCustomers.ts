import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCustomers(enabled: boolean = false) {
  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const { data: customersData, error } = await supabase
          .from('customers')
          .select('id, name, customer_number, organization_number')
          .order('name');

        if (error) {
          console.error('Error fetching customers:', error);
          toast.error("Failed to fetch customers");
          throw error;
        }

        if (!customersData) {
          return [];
        }
        
        return customersData;
      } catch (error) {
        console.error('Error in customers query:', error);
        toast.error("Failed to fetch customers");
        throw error;
      }
    },
    enabled: enabled, // Only fetch when enabled is true
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnMount: false, // Don't refetch on mount by default
  });

  return { customers, loading };
}