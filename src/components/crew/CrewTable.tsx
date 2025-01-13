import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CrewTableRow } from "./CrewTableRow";
import { CrewMember } from "@/types/crew";
import { Separator } from "@/components/ui/separator";

interface CrewTableProps {
  crew: CrewMember[];
  selectedItem: string | null;
  onItemSelect: (id: string) => void;
}

export function CrewTable({ crew, selectedItem, onItemSelect }: CrewTableProps) {
  // Group crew members by folder
  const groupedCrew = crew.reduce((groups, member) => {
    const folder = member.folderName || 'No Folder';
    if (!groups[folder]) {
      groups[folder] = [];
    }
    groups[folder].push(member);
    return groups;
  }, {} as Record<string, CrewMember[]>);

  return (
    <div className="relative">
      <Table>
        <TableHeader className="sticky top-0 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/75 z-10">
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="min-w-[200px]">Name</TableHead>
            <TableHead className="min-w-[200px]">Roles</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Folder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedCrew).map(([folder, members]) => (
            <div key={folder}>
              <TableRow className="bg-zinc-800/50">
                <TableHead colSpan={6} className="h-8 text-sm font-medium text-muted-foreground">
                  {folder}
                </TableHead>
              </TableRow>
              {members.map((member) => (
                <CrewTableRow
                  key={member.id}
                  member={member}
                  isSelected={selectedItem === member.id}
                  onSelect={() => onItemSelect(member.id)}
                />
              ))}
            </div>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}