import { CrewTable } from "./crew/CrewTable";
import { useState } from "react";
import { CrewActions } from "./crew/CrewActions";
import { Card, CardContent } from "./ui/card";
import { Filter, Loader2, X } from "lucide-react";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useCrew } from "@/hooks/useCrew";
import { AddMemberDialog } from "./crew/AddMemberDialog";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function CrewList() {
  const { crew, loading } = useCrew();
  const { roles } = useCrewRoles();
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

  const filteredCrew = crew.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRoles = selectedRoles.length === 0 || 
      selectedRoles.every(roleId => member.roles?.includes(roleId));

    return matchesSearch && matchesRoles;
  });

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                      {selectedRoles.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {selectedRoles.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {roles.map((role) => (
                      <DropdownMenuCheckboxItem
                        key={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                      >
                        {role.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedRoles.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </Button>
                )}
              </div>
              <CrewActions 
                selectedItems={selectedItem ? [selectedItem] : []} 
                onCrewMemberDeleted={() => setSelectedItem(null)}
              />
              <AddMemberDialog />
            </div>
            <Separator className="bg-zinc-800" />
            
            <div className="rounded-lg overflow-hidden border border-zinc-800">
              <CrewTable 
                crew={filteredCrew} 
                selectedItem={selectedItem}
                onItemSelect={handleItemSelect}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}