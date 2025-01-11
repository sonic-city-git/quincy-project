import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventType } from "@/types/events";

const EVENT_TYPE_ORDER = [
  'Show',
  'Double Show',
  'Preprod',
  'Travel',
  'INT Storage',
  'EXT Storage',
  'Hours'
];

export const useEventTypes = () => {
  return useQuery({
    queryKey: ['eventTypes'],
    queryFn: async (): Promise<EventType[]> => {
      console.log('Fetching event types...');
      const { data, error } = await supabase
        .from('event_types')
        .select('*');

      if (error) {
        console.error('Error fetching event types:', error);
        throw error;
      }
      
      // Sort the data according to the predefined order
      const sortedData = data.sort((a, b) => {
        const indexA = EVENT_TYPE_ORDER.indexOf(a.name);
        const indexB = EVENT_TYPE_ORDER.indexOf(b.name);
        return indexA - indexB;
      });

      console.log('Fetched event types:', sortedData);
      return sortedData;
    }
  });
};