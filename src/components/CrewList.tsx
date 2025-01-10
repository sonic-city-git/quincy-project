import { CrewTable } from "./crew/CrewTable";
import { useState } from "react";
import { CrewActions } from "./crew/CrewActions";
import { Card, CardContent } from "./ui/card";
import { Filter, Loader2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { CrewCard } from "./CrewCard";
import { ViewToggle } from "./projects/ViewToggle";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useCrew } from "@/hooks/useCrew";
import { AddMemberDialog } from "./crew/AddMemberDialog";
import { useCrewRoles } from "@/hooks/useCrewRoles";

export function CrewList() {
  const { crew, loading } = useCrew();
  const { roles } = useCrewRoles();
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const handleItemSelect = (id: string) => {
    setSelectedItem(prev => prev === id ? null : id);
  };

  const filteredCrew = crew.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-6 max-w-[1600px] mx-auto">
      <Card className="border-0 shadow-md bg-zinc-900/50">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="Search crew members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm bg-zinc-800/50"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
              <CrewActions 
                selectedItems={selectedItem ? [selectedItem] : []} 
                onCrewMemberDeleted={() => setSelectedItem(null)}
              />
              <AddMemberDialog />
            </div>
            <Separator className="bg-zinc-800" />
            
            {viewMode === 'list' ? (
              <div className="rounded-lg overflow-hidden border border-zinc-800">
                <CrewTable 
                  crew={filteredCrew} 
                  selectedItem={selectedItem}
                  onItemSelect={handleItemSelect}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCrew.map((member) => {
                  const memberRoles = roles.filter(role => 
                    member.roles?.includes(role.id)
                  );
                  
                  return (
                    <CrewCard
                      key={member.id}
                      name={member.name}
                      email={member.email || ''}
                      phone={member.phone || ''}
                      folderName={member.folderName || ''}
                      roles={memberRoles}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}