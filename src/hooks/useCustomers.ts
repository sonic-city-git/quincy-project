import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCustomers() {
  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        console.log('Starting customer fetch...');
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
          console.log('No customers data returned');
          return [];
        }

        console.log('Raw customers data:', customersData);
        console.log('Number of customers:', customersData.length);
        console.log('First customer:', customersData[0]);
        
        return customersData;
      } catch (error) {
        console.error('Error in customers query:', error);
        toast.error("Failed to fetch customers");
        throw error;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnMount: true,
  });

  return { customers, loading };
}