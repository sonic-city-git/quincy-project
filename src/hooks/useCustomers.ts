import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCustomers(enabled: boolean = false) {
  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        console.log('Starting customer fetch with detailed logging...');
        
        const { data: customersData, error } = await supabase
          .from('customers')
          .select('id, name, customer_number, organization_number')
          .order('name');

        if (error) {
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          toast.error("Failed to fetch customers");
          throw error;
        }

        if (!customersData) {
          console.log('No customers data returned from Supabase');
          return [];
        }

        console.log('Successfully fetched customers:', {
          count: customersData.length,
          firstCustomer: customersData[0],
          allCustomers: customersData
        });
        
        return customersData;
      } catch (error) {
        console.error('Detailed error in customers query:', error);
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