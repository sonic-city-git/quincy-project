import { CrewMember } from "@/types/crew";

// Define the folder order by ID
const SONIC_CITY_FOLDER_ID = "34f3469f-02bd-4ecf-82f9-11a4e88c2d77";
const ASSOCIATE_FOLDER_ID = "c37d9b68-fe80-4d24-b63d-3c95f880d6f5";
const FREELANCE_FOLDER_ID = "9d50e080-4d0c-4ddb-b5e1-10fadd3e48b5";

const FOLDER_ORDER = [SONIC_CITY_FOLDER_ID, ASSOCIATE_FOLDER_ID, FREELANCE_FOLDER_ID];

export function useCrewSort() {
  const sortCrew = (crew: CrewMember[]) => {
    return [...crew].sort((a, b) => {
      const folderIdA = a.folder_id || '';
      const folderIdB = b.folder_id || '';

      // Get the index of each folder in the folderOrder array
      const indexA = FOLDER_ORDER.indexOf(folderIdA);
      const indexB = FOLDER_ORDER.indexOf(folderIdB);

      // If both folders are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one folder is in the order array, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // If neither folder is in the order array, sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  };

  return { sortCrew };
}