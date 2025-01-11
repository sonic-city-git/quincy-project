import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventType } from "@/types/events";

export const useEventTypes = () => {
  return useQuery({
    queryKey: ['eventTypes'],
    queryFn: async (): Promise<EventType[]> => {
      console.log('Fetching event types...');
      const { data, error } = await supabase
        .from('event_types')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching event types:', error);
        throw error;
      }
      
      console.log('Fetched event types:', data);
      return data;
    }
  });
};