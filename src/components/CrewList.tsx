import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { CrewHeader } from "./crew/CrewHeader";
import { CrewTimeline } from "./crew/CrewTimeline";
import { addDays, subDays } from "date-fns";

const MOCK_CREW = [
  {
    id: "1",
    name: "John Doe",
    role: "Sound Engineer",
    email: "john@soniccity.no",
    phone: "+47 123 45 678",
    status: "Available",
  },
  {
    id: "2",
    name: "Jane Smith",
    role: "Lighting Technician",
    email: "jane@soniccity.no",
    phone: "+47 234 56 789",
    status: "On Project",
  },
  {
    id: "3",
    name: "Mike Johnson",
    role: "Stage Manager",
    email: "mike@soniccity.no",
    phone: "+47 345 67 890",
    status: "Available",
  },
];

export function CrewList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const daysToShow = 14;

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
      <CrewHeader selectedCount={selectedItems.length} />

      <div className="bg-zinc-900 rounded-md">
        <div className="min-h-[48px]">
          {selectedItems.length > 0 && (
            <div className="p-2 border-b border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">{selectedItems.length} items selected</span>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Package className="h-4 w-4" />
                  EDIT
                </Button>
              </div>
              <Button variant="ghost" size="sm">
                Adjust view
              </Button>
            </div>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-zinc-800/50">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="whitespace-nowrap">Name</TableHead>
              <TableHead className="whitespace-nowrap">Role</TableHead>
              <TableHead className="whitespace-nowrap">Email</TableHead>
              <TableHead className="whitespace-nowrap">Phone</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CREW.map((crew) => (
              <TableRow key={crew.id} className="h-8 hover:bg-zinc-800/50 border-b border-zinc-800/50">
                <TableCell className="w-12">
                  <Checkbox 
                    checked={selectedItems.includes(crew.id)}
                    onCheckedChange={() => handleItemSelect(crew.id)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.name}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.role}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.email}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.phone}</TableCell>
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

        <CrewTimeline 
          startDate={startDate}
          daysToShow={daysToShow}
          selectedCrew={selectedCrew}
          onPreviousPeriod={handlePreviousPeriod}
          onNextPeriod={handleNextPeriod}
        />
      </div>
    </div>
  );
}