import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useState } from "react";
import { CrewHeader } from "./crew/CrewHeader";
import { CrewTimeline } from "./crew/CrewTimeline";
import { addDays, subDays } from "date-fns";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  folder: string;
}

const MOCK_CREW = [
  {
    id: "1",
    name: "John Doe",
    role: "FOH, MON",
    email: "john@soniccity.no",
    phone: "+47 123 45 678",
    folder: "Sonic City",
  },
  {
    id: "2",
    name: "Jane Smith",
    role: "PLAYBACK, BACKLINE",
    email: "jane@soniccity.no",
    phone: "+47 234 56 789",
    folder: "Freelance",
  },
  {
    id: "3",
    name: "Mike Johnson",
    role: "FOH",
    email: "mike@soniccity.no",
    phone: "+47 345 67 890",
    folder: "Sonic City",
  },
];

const TAG_COLORS: { [key: string]: string } = {
  FOH: "bg-[#8B5CF6] text-white",
  MON: "bg-[#D946EF] text-white",
  PLAYBACK: "bg-[#F97316] text-white",
  BACKLINE: "bg-[#0EA5E9] text-white",
};

export function CrewList() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>(MOCK_CREW);
  const daysToShow = 14;

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleAddCrewMember = (newMember: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    folder: string;
    tags: string[];
  }) => {
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

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const selectedCrew = crewMembers.filter(crew => selectedItems.includes(crew.id));

  const renderTags = (role: string) => {
    const tags = role.split(", ");
    return (
      <div className="flex gap-1 flex-wrap">
        {tags.map((tag, index) => {
          const upperTag = tag.toUpperCase();
          return (
            <span
              key={index}
              className={`px-2 py-0.5 rounded text-xs font-medium ${TAG_COLORS[upperTag] || 'bg-zinc-700 text-white'}`}
            >
              {upperTag}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <CrewHeader selectedCount={selectedItems.length} onAddCrewMember={handleAddCrewMember} />

      <div className="bg-zinc-900 rounded-md">
        <div className="h-[48px] border-b border-zinc-800/50">
          <div className={`h-full flex items-center justify-between px-2 transition-opacity duration-200 ${selectedItems.length === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">{selectedItems.length} items selected</span>
              <Button variant="ghost" size="sm" className="gap-2">
                <Package className="h-4 w-4" />
                EDIT
              </Button>
            </div>
          </div>
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
              <TableHead className="whitespace-nowrap">Folder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crewMembers.map((crew) => (
              <TableRow key={crew.id} className="h-8 hover:bg-zinc-800/50 border-b border-zinc-800/50">
                <TableCell className="w-12">
                  <Checkbox 
                    checked={selectedItems.includes(crew.id)}
                    onCheckedChange={() => handleItemSelect(crew.id)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.name}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {renderTags(crew.role)}
                </TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.email}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.phone}</TableCell>
                <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">{crew.folder}</TableCell>
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