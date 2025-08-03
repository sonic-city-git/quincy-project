import { ResourceType } from "../../types/resource";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ResourceTypeFiltersProps {
  selectedType: ResourceType | null;
  selectedRoles: string[];
  selectedFolders: string[];
  roles: { id: string; name: string }[];
  folders: { id: string; name: string }[];
  onRoleToggle: (roleId: string) => void;
  onFolderToggle: (folderId: string) => void;
}

export function ResourceTypeFilters({
  selectedType,
  selectedRoles,
  selectedFolders,
  roles,
  folders,
  onRoleToggle,
  onFolderToggle,
}: ResourceTypeFiltersProps) {
  if (!selectedType) return null;

  return (
    <div className="space-y-4">
      <Separator />
      {selectedType === ResourceType.CREW && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Roles</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {roles.map((role) => (
                <Badge
                  key={role.id}
                  variant={selectedRoles.includes(role.id) ? "default" : "outline"}
                  className="mr-2 cursor-pointer"
                  onClick={() => onRoleToggle(role.id)}
                >
                  {role.name}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {selectedType === ResourceType.EQUIPMENT && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Folders</h4>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {folders.map((folder) => (
                <Badge
                  key={folder.id}
                  variant={selectedFolders.includes(folder.id) ? "default" : "outline"}
                  className="mr-2 cursor-pointer"
                  onClick={() => onFolderToggle(folder.id)}
                >
                  {folder.name}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}