import { useQuery } from "@tanstack/react-query";
import { CrewMember } from "@/types/crew";
import { supabase } from "@/integrations/supabase/client";

// Define the folder order by ID instead of name to ensure exact matches
const FOLDER_ORDER = ["Sonic City", "Associate", "Freelance"];

export function useCrewSort() {
  const { data: folders } = useQuery({
    queryKey: ['crew-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_folders')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching crew folders:', error);
        return [];
      }
      
      return data;
    }
  });

  const sortCrew = (crew: CrewMember[]) => {
    return [...crew].sort((a, b) => {
      const folderA = a.folderName || '';
      const folderB = b.folderName || '';

      // Get the index of each folder in the folderOrder array
      const indexA = FOLDER_ORDER.indexOf(folderA);
      const indexB = FOLDER_ORDER.indexOf(folderB);

      // If both folders are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one folder is in the order array, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // For folders not in the order array, sort alphabetically
      if (folderA !== folderB) {
        return folderA.localeCompare(folderB);
      }

      // Within the same folder, sort by name
      return a.name.localeCompare(b.name);
    });
  };

  return { sortCrew };
}