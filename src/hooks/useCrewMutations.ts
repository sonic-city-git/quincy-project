import { useAddCrewMember } from "./crew/useAddCrewMember";
import { useEditCrewMember } from "./crew/useEditCrewMember";
import { useDeleteCrewMembers } from "./crew/useDeleteCrewMembers";

export function useCrewMutations(fetchCrewMembers: () => Promise<void>) {
  const handleAddCrewMember = useAddCrewMember(fetchCrewMembers);
  const handleEditCrewMember = useEditCrewMember(fetchCrewMembers);
  const handleDeleteCrewMembers = useDeleteCrewMembers(fetchCrewMembers);

  return {
    handleAddCrewMember,
    handleEditCrewMember,
    handleDeleteCrewMembers,
  };
}