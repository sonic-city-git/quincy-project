import { CrewMember } from "@/types/crew";
import { CREW_FOLDER_ORDER } from "@/utils/crewFolderSort";

// Define the folder order by ID (mapped to folder names)
const SONIC_CITY_FOLDER_ID = "34f3469f-02bd-4ecf-82f9-11a4e88c2d77";
const ASSOCIATE_FOLDER_ID = "c37d9b68-fe80-4d24-b63d-3c95f880d6f5";
const FREELANCE_FOLDER_ID = "9d50e080-4d0c-4ddb-b5e1-10fadd3e48b5";

// Legacy folder IDs for backward compatibility

export function useCrewSort() {
  const sortCrew = (crew: CrewMember[]) => {
    return [...crew].sort((a, b) => {
      // Get folder names for sorting (requires crew members to have folder info)
      const folderA = crew.find(m => m.id === a.id)?.crew_folders?.name || '';
      const folderB = crew.find(m => m.id === b.id)?.crew_folders?.name || '';

      // Use the standardized crew folder order: Sonic City → Associates → Freelancers
      const indexA = CREW_FOLDER_ORDER.indexOf(folderA as any);
      const indexB = CREW_FOLDER_ORDER.indexOf(folderB as any);

      // If both folders are in the priority order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one folder is in the priority order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // Fallback to ID-based sorting for legacy compatibility
      const folderIdA = a.folder_id || '';
      const folderIdB = b.folder_id || '';
      const legacyOrder = [SONIC_CITY_FOLDER_ID, ASSOCIATE_FOLDER_ID, FREELANCE_FOLDER_ID];
      
      const legacyIndexA = legacyOrder.indexOf(folderIdA);
      const legacyIndexB = legacyOrder.indexOf(folderIdB);
      
      if (legacyIndexA !== -1 && legacyIndexB !== -1) {
        return legacyIndexA - legacyIndexB;
      }
      if (legacyIndexA !== -1) return -1;
      if (legacyIndexB !== -1) return 1;

      // If neither folder is prioritized, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };

  return { sortCrew };
}