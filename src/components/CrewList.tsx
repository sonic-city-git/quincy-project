import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useCrew } from "@/hooks/useCrew";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { CrewTable } from "./crew/CrewTable";
import { CrewListHeader } from "./crew/CrewListHeader";

export function CrewList() {
  const { crew = [], loading, refetch } = useCrew();
  const { roles = [] } = useCrewRoles();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      }
      return [...prev, roleId];
    });
  };

  const clearFilters = () => {
    setSelectedRoles([]);
  };

  const filteredCrew = (crew || []).filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRoles = selectedRoles.length === 0 || 
      selectedRoles.every(roleId => member.roles?.includes(roleId));

    return matchesSearch && matchesRoles;
  });

  // Define folder order
  const folderOrder = ["Sonic City", "Associate", "Freelance"];

  // Sort crew members by folder order and then alphabetically by name
  const sortedCrew = [...filteredCrew].sort((a, b) => {
    const folderA = a.folderName?.toLowerCase() || '';
    const folderB = b.folderName?.toLowerCase() || '';

    // Get the index of each folder in the folderOrder array
    const indexA = folderOrder.findIndex(f => f.toLowerCase() === folderA);
    const indexB = folderOrder.findIndex(f => f.toLowerCase() === folderB);

    // If both folders are in the order array, sort by their order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only one folder is in the order array, prioritize it
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // If neither folder is in the order array, sort alphabetically by folder name
    if (folderA !== folderB) {
      return folderA.localeCompare(folderB);
    }

    // If folders are the same, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] py-6">
      <Card className="border-0 shadow-md bg-zinc-900/50 h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="space-y-6 h-full flex flex-col">
            <CrewListHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              roles={roles}
              selectedRoles={selectedRoles}
              onRoleToggle={handleRoleToggle}
              onClearFilters={clearFilters}
              selectedItem={selectedItem}
              onCrewMemberDeleted={() => setSelectedItem(null)}
            />
            <Separator className="bg-zinc-800" />
            
            <div className="rounded-lg overflow-hidden border border-zinc-800 flex-1 min-h-0">
              <div className="h-full overflow-auto">
                <CrewTable 
                  crew={sortedCrew} 
                  selectedItem={selectedItem}
                  onItemSelect={handleItemSelect}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}