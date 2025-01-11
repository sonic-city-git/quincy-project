import { CrewMember } from "@/types/crew";

const folderOrder = ["Sonic City", "Associate", "Freelance"];

export function useCrewSort() {
  const sortCrew = (crew: CrewMember[]) => {
    return [...crew].sort((a, b) => {
      const folderA = a.folderName?.toLowerCase() || '';
      const folderB = b.folderName?.toLowerCase() || '';

      const indexA = folderOrder.findIndex(f => f.toLowerCase() === folderA);
      const indexB = folderOrder.findIndex(f => f.toLowerCase() === folderB);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      if (folderA !== folderB) {
        return folderA.localeCompare(folderB);
      }

      return a.name.localeCompare(b.name);
    });
  };

  return { sortCrew };
}