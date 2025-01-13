import { TableCell, TableRow } from "@/components/ui/table";
import { CrewMember } from "@/types/crew";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { sortRoles } from "@/utils/roleUtils";
import { useState } from "react";
import { EditMemberDialog } from "./EditMemberDialog";

interface CrewTableRowProps {
  member: CrewMember;
  isSelected: boolean;
  onSelect: () => void;
}

export function CrewTableRow({ member, isSelected, onSelect }: CrewTableRowProps) {
  const { roles: allRoles } = useCrewRoles();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const memberRoles = sortRoles(
    allRoles.filter(role => member.roles?.includes(role.id))
  );

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Prevent text selection
    window.getSelection()?.removeAllRanges();
    setEditDialogOpen(true);
    onSelect();
  };

  return (
    <>
      <TableRow 
        className={`group hover:bg-zinc-800/50 cursor-pointer select-none ${
          isSelected ? 'bg-zinc-800/75' : ''
        }`}
        onDoubleClick={handleDoubleClick}
      >
        <TableCell className="w-[300px]">
          <div className="text-sm font-medium truncate">
            {member.name}
          </div>
        </TableCell>
        <TableCell className="w-[200px]">
          <div className="flex gap-1">
            {memberRoles.map((role) => (
              <div
                key={role.id}
                className="text-xs px-2 py-1 rounded text-white whitespace-nowrap"
                style={{ backgroundColor: role.color }}
              >
                {role.name}
              </div>
            ))}
          </div>
        </TableCell>
        <TableCell className="w-[100px] text-right">
          <span className="text-sm text-muted-foreground truncate block">
            {member.email || '-'}
          </span>
        </TableCell>
        <TableCell className="w-[150px] text-right">
          <span className="text-sm text-muted-foreground truncate block">
            {member.phone || '-'}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground truncate block">
            {member.folderName || '-'}
          </span>
        </TableCell>
      </TableRow>
      <EditMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        member={member}
        onCrewMemberDeleted={() => {
          setEditDialogOpen(false);
          onSelect();
        }}
      />
    </>
  );
}