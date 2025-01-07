import { useState } from "react";
import { CrewMember, NewCrewMember } from "@/types/crew";
import { MOCK_CREW } from "@/data/mockCrew";

export function useCrewManagement() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>(MOCK_CREW);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleAddCrewMember = (newMember: NewCrewMember) => {
    const crewMember: CrewMember = {
      id: (crewMembers.length + 1).toString(),
      name: `${newMember.firstName} ${newMember.lastName}`,
      role: newMember.tags.join(", "),
      email: newMember.email,
      phone: newMember.phone,
      folder: newMember.folder,
    };

    setCrewMembers((prev) => [...prev, crewMember]);
  };

  const handleEditCrewMember = (editedMember: CrewMember) => {
    setCrewMembers((prev) =>
      prev.map((member) =>
        member.id === editedMember.id ? editedMember : member
      )
    );
    setSelectedItems([]);
  };

  const handleDeleteCrewMembers = () => {
    setCrewMembers((prev) => 
      prev.filter((member) => !selectedItems.includes(member.id))
    );
    setSelectedItems([]);
  };

  const handleRoleSelect = (role: string, checked: boolean) => {
    setSelectedRoles((prev) =>
      checked
        ? [...prev, role]
        : prev.filter((r) => r !== role)
    );
  };

  // Get all unique roles from crew members
  const allRoles = Array.from(
    new Set(
      crewMembers.flatMap((member) =>
        member.role.split(", ").map((role) => role.toUpperCase())
      )
    )
  ).sort();

  // Filter and sort crew members
  const filteredCrewMembers = crewMembers
    .filter((member) => {
      if (selectedRoles.length === 0) return true;
      return member.role
        .split(", ")
        .some((role) => selectedRoles.includes(role.toUpperCase()));
    })
    .sort((a, b) => {
      // First sort by folder (Sonic City first, then others)
      if (a.folder === "Sonic City" && b.folder !== "Sonic City") return -1;
      if (a.folder !== "Sonic City" && b.folder === "Sonic City") return 1;
      
      // If folders are the same, sort alphabetically by name
      if (a.folder === b.folder) {
        return a.name.localeCompare(b.name);
      }
      
      // If folders are different (and neither is Sonic City), sort alphabetically by folder
      return a.folder.localeCompare(b.folder);
    });

  const selectedCrew = filteredCrewMembers.filter(crew => 
    selectedItems.includes(crew.id)
  );

  return {
    selectedItems,
    startDate,
    setStartDate,
    selectedRoles,
    allRoles,
    filteredCrewMembers,
    selectedCrew,
    handleItemSelect,
    handleAddCrewMember,
    handleEditCrewMember,
    handleDeleteCrewMembers,
    handleRoleSelect,
  };
}