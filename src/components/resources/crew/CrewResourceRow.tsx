import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResourceCrew } from "../types/resource";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface CrewResourceRowProps {
  resource: ResourceCrew;
  isSelected: boolean;
  onSelect: () => void;
  showCheckbox?: boolean;
}

export function CrewResourceRow({
  resource,
  isSelected,
  onSelect,
  showCheckbox,
}: CrewResourceRowProps) {
  const initials = resource.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <TableRow
              className={`cursor-pointer ${isSelected ? "bg-primary/10" : ""}`}
      onClick={onSelect}
    >
      {showCheckbox && (
        <TableCell className="w-[30px]">
          <Checkbox checked={isSelected} />
        </TableCell>
      )}
      <TableCell className="py-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {resource.avatar_url ? (
              <AvatarImage
                src={resource.avatar_url}
                alt={resource.name}
                className="object-cover"
              />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>
          <span>{resource.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1 flex-wrap">
          {resource.roles.map((role) => (
            <Badge key={role} className={getRoleBadgeClasses(role)}>
              {role}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {new Date(resource.updated_at).toLocaleDateString()}
      </TableCell>
    </TableRow>
  );
}