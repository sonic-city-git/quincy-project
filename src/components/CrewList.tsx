import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useCrew } from "@/hooks/useCrew";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { CrewTable } from "./crew/CrewTable";
import { CrewListHeader } from "./crew/CrewListHeader";

export function CrewList() {
  const { crew = [], loading } = useCrew();
  const { roles = [] } = useCrewRoles();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

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

  // Sort crew members with Sonic City folder members on top
  const sortedCrew = [...filteredCrew].sort((a, b) => {
    const isSonicCityA = a.folderName?.toLowerCase() === 'sonic city';
    const isSonicCityB = b.folderName?.toLowerCase() === 'sonic city';

    if (isSonicCityA && !isSonicCityB) return -1;
    if (!isSonicCityA && isSonicCityB) return 1;

    // If both are or aren't from Sonic City, sort alphabetically by name
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