import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Trash, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

const MOCK_CREW = [
  {
    id: "1",
    name: "John Doe",
    role: "Sound Engineer",
    email: "john@soniccity.no",
    phone: "+47 123 45 678",
    status: "Available",
    hours: "54:00",
  },
  {
    id: "2",
    name: "Jane Smith",
    role: "Lighting Technician",
    email: "jane@soniccity.no",
    phone: "+47 234 56 789",
    status: "On Project",
    hours: "32:00",
  },
  {
    id: "3",
    name: "Mike Johnson",
    role: "Stage Manager",
    email: "mike@soniccity.no",
    phone: "+47 345 67 890",
    status: "Available",
    hours: "48:00",
  },
];

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept"];

export function CrewList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showTimeline, setShowTimeline] = useState(false);

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            All departments
          </Button>
          <Button variant="ghost" size="sm">
            All
          </Button>
        </div>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add crew member
        </Button>
      </div>

      <div className="bg-zinc-900 rounded-md">
        {selectedItems.length > 0 && (
          <div className="p-2 border-b border-zinc-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">{selectedItems.length} members selected</span>
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                EDIT
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              {showTimeline ? "Hide timeline" : "Show timeline"}
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CREW.map((crew) => (
              <TableRow key={crew.id} className="hover:bg-zinc-800/50 border-b border-zinc-800/50">
                <TableCell className="w-12">
                  <Checkbox 
                    checked={selectedItems.includes(crew.id)}
                    onCheckedChange={() => handleItemSelect(crew.id)}
                  />
                </TableCell>
                <TableCell>{crew.name}</TableCell>
                <TableCell>{crew.role}</TableCell>
                <TableCell>{crew.email}</TableCell>
                <TableCell>{crew.phone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-sm ${
                    crew.status === "Available" ? "bg-green-500/20 text-green-500" : "bg-amber-500/20 text-amber-500"
                  }`}>
                    {crew.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {showTimeline && selectedItems.length > 0 && (
          <div className="border-t border-zinc-800/50">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">31 Dec 2024 - 20 Jan</span>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  -
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  +
                </Button>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-11 gap-4 mb-4">
                {MONTHS.map((month) => (
                  <div key={month} className="text-xs text-zinc-400">
                    {month}
                  </div>
                ))}
              </div>
              
              {MOCK_CREW.filter(crew => selectedItems.includes(crew.id)).map((crew) => (
                <div key={crew.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{crew.name}</span>
                    <span className="text-xs text-zinc-400">{crew.hours} hours</span>
                  </div>
                  <div className="grid grid-cols-11 gap-4">
                    {MONTHS.map((month) => (
                      <div 
                        key={month} 
                        className="h-4 bg-zinc-800/50 rounded-sm relative"
                      >
                        {/* This would be replaced with actual availability data */}
                        {Math.random() > 0.5 && (
                          <div 
                            className="absolute top-0 left-0 h-full bg-blue-500/50 rounded-sm"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}