/**
 * 🏢 EXTERNAL PROVIDERS HOOK
 * 
 * Manages external equipment providers for subrental operations.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExternalProvider {
  id: string;
  company_name: string;
  contact_email: string | null;
  phone: string | null;
  website: string | null;
  geographic_coverage: string[] | null;
  reliability_rating: number | null;
  preferred_status: boolean;
}

export function useExternalProviders() {
  return useQuery({
    queryKey: ['external-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('external_providers')
        .select('*')
        .order('preferred_status', { ascending: false })
        .order('reliability_rating', { ascending: false });

      if (error) {
        console.error('Error fetching external providers:', error);
        throw error;
      }

      return data as ExternalProvider[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  });
}
