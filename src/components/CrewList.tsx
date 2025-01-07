import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserPlus, Users, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { format, eachDayOfInterval, addDays, subDays } from "date-fns";

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

export function CrewList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const daysToShow = 14;

  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysToShow - 1)
  });

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const selectedCrew = MOCK_CREW.filter(crew => selectedItems.includes(crew.id));

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
          <div className="p-2 border-b border-zinc-800/50 flex items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">{selectedItems.length} members selected</span>
              <Button variant="ghost" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                EDIT
              </Button>
            </div>
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

        <div className="border-t border-zinc-800/50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePreviousPeriod}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePreviousPeriod}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                {format(startDate, 'dd MMM yyyy')} - {format(addDays(startDate, daysToShow - 1), 'dd MMM yyyy')}
              </span>
              <Button variant="ghost" size="sm" onClick={handleNextPeriod}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNextPeriod}>
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
            <div className="grid grid-cols-14 gap-1 mb-4">
              {days.map((day) => (
                <div key={day.toISOString()} className="text-xs text-zinc-400">
                  {format(day, 'dd')}
                </div>
              ))}
            </div>
            
            {selectedItems.length > 0 ? (
              selectedCrew.map((crew) => (
                <div key={crew.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{crew.name}</span>
                    <span className="text-xs text-zinc-400">{crew.hours} hours</span>
                  </div>
                  <div className="grid grid-cols-14 gap-1">
                    {days.map((day) => (
                      <div 
                        key={day.toISOString()} 
                        className="h-4 bg-zinc-800/50 rounded-sm relative"
                      >
                        {Math.random() > 0.5 && (
                          <div 
                            className="absolute top-0 left-0 h-full bg-blue-500/50 rounded-sm"
                            style={{ width: '100%' }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-zinc-400">
                Select crew members to view their timeline
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}