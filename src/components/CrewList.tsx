import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Loader2 } from "lucide-react";
import { useCrew } from "@/hooks/useCrew";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { CrewTable } from "./crew/CrewTable";
import { CrewListHeader } from "./crew/CrewListHeader";
import { useCrewFilters } from "./crew/filters/useCrewFilters";
import { useCrewSort } from "./crew/useCrewSort";

export function CrewList() {
  const { crew = [], loading, refetch } = useCrew();
  const { roles = [] } = useCrewRoles();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedRoles, 
    handleRoleToggle, 
    clearFilters, 
    filterCrew 
  } = useCrewFilters();
  const { sortCrew } = useCrewSort();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const filteredCrew = filterCrew(crew);
  const sortedCrew = sortCrew(filteredCrew);

  return (
    <div className="h-[calc(100vh-2rem)] py-6">
      <Card className="border-0 shadow-md bg-zinc-900 h-full">
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