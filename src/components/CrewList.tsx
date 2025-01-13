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
import { Table } from "./ui/table";
import { CrewTableHeader } from "./crew/CrewTableHeader";

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
            
            <div className="rounded-lg overflow-hidden border border-zinc-800 flex-1 min-h-0 flex flex-col">
              <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 min-w-max">
                <Table>
                  <CrewTableHeader />
                </Table>
              </div>
              <div className="overflow-auto flex-1">
                <CrewTable 
                  crew={sortedCrew} 
                  selectedItem={selectedItem}
                  onItemSelect={setSelectedItem}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}