import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useCrewRoles } from "@/hooks/useCrewRoles";

interface RoleSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function RoleSelector({ selectedTags, onTagsChange }: RoleSelectorProps) {
  const { roles, isLoading } = useCrewRoles();

  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked) {
      onTagsChange([...selectedTags, tag.toLowerCase()]);
    } else {
      onTagsChange(selectedTags.filter(t => t !== tag.toLowerCase()));
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-zinc-100 dark:bg-zinc-800 rounded-md" />;
  }

  return (
    <div className="grid gap-2">
      <Label>Role</Label>
      <div className="flex flex-wrap gap-4">
        {roles.map((role) => (
          <div key={role.id} className="flex items-center space-x-2">
            <Checkbox
              id={role.name.toLowerCase()}
              checked={selectedTags.includes(role.name.toLowerCase())}
              onCheckedChange={(checked) => {
                handleTagChange(role.name, checked as boolean);
              }}
            />
            <Label htmlFor={role.name.toLowerCase()} className="text-sm font-normal">
              {role.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}