import { CrewMember } from "@/types/crew";

const folderOrder = ["Sonic City", "Associate", "Freelance"];

export function useCrewSort() {
  const sortCrew = (crew: CrewMember[]) => {
    return [...crew].sort((a, b) => {
      const folderA = a.folderName || '';
      const folderB = b.folderName || '';

      // Get the index of each folder in the folderOrder array
      const indexA = folderOrder.indexOf(folderA);
      const indexB = folderOrder.indexOf(folderB);

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