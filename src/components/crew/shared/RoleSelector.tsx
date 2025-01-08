import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TAGS } from "../constants";

interface RoleSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function RoleSelector({ selectedTags, onTagsChange }: RoleSelectorProps) {
  const handleTagChange = (tag: string, checked: boolean) => {
    if (checked) {
      onTagsChange([...selectedTags, tag]);
    } else {
      onTagsChange(selectedTags.filter(t => t !== tag));
    }
  };

  return (
    <div className="grid gap-2">
      <Label>Role</Label>
      <div className="flex flex-wrap gap-4">
        {TAGS.map((tag) => (
          <div key={tag.id} className="flex items-center space-x-2">
            <Checkbox
              id={tag.id}
              checked={selectedTags.includes(tag.id)}
              onCheckedChange={(checked) => {
                handleTagChange(tag.id, checked as boolean);
              }}
            />
            <Label htmlFor={tag.id} className="text-sm font-normal">
              {tag.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}