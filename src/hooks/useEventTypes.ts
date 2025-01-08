import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventType } from "@/types/events";

export const useEventTypes = () => {
  return useQuery({
    queryKey: ['eventTypes'],
    queryFn: async (): Promise<EventType[]> => {
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });
};