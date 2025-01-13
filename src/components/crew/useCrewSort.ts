import { CrewMember } from "@/types/crew";

const folderOrder = ["Sonic City", "Associate", "Freelance"];

export function useCrewSort() {
  const sortCrew = (crew: CrewMember[]) => {
    return [...crew].sort((a, b) => {
      const folderA = a.folderName?.toLowerCase() || '';
      const folderB = b.folderName?.toLowerCase() || '';

      // First sort by folder order
      const indexA = folderOrder.findIndex(f => f.toLowerCase() === folderA);
      const indexB = folderOrder.findIndex(f => f.toLowerCase() === folderB);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // If folders are different but not in the predefined order
      if (folderA !== folderB) {
        return folderA.localeCompare(folderB);
      }

      // Then sort alphabetically by name
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  return { sortCrew };
}