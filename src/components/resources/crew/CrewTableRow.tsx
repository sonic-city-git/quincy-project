import { TableCell, TableRow } from "@/components/ui/table";
import { CrewMember } from "@/types/crew";
import { Badge } from "@/components/ui/badge";
import { useCrewRoles } from "@/hooks/useCrewRoles";
import { COMPONENT_CLASSES, cn, getRoleBadgeClasses } from "@/design-system";

interface CrewTableRowProps {
  member: CrewMember;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
}

export function CrewTableRow({ member, isSelected, isHighlighted, onSelect }: CrewTableRowProps) {
  const { roles: allRoles } = useCrewRoles();
  
  const memberRoles = allRoles.filter(role => 
    member.roles?.includes(role.name)
  );

  return (
    <div 
      data-crew-id={member.id}
      className={cn(
        "grid grid-cols-[2fr_200px_120px] sm:grid-cols-[2fr_200px_160px_120px] gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer select-none transition-colors duration-300",
        COMPONENT_CLASSES.table.row,
        isSelected && "bg-muted/75",
        isHighlighted && "bg-primary/20 border border-primary/50"
      )}
      onDoubleClick={onSelect}
    >
      {/* Name */}
      <div className="flex flex-col space-y-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {member.name}
        </div>
      </div>

      {/* Roles */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {memberRoles.map((role) => (
          <Badge
            key={role.id}
            className={getRoleBadgeClasses(role.name)}
          >
            {role.name}
          </Badge>
        ))}
      </div>

      {/* Email - Hidden on mobile */}
      <div className="hidden sm:flex items-center">
        <span className="text-sm text-muted-foreground truncate">
          {member.email || '-'}
        </span>
      </div>

      {/* Phone - Hidden on mobile */}
      <div className="hidden sm:flex items-center">
        <span className="text-sm text-muted-foreground truncate">
          {member.phone || '-'}
        </span>
      </div>
    </div>
  );
}