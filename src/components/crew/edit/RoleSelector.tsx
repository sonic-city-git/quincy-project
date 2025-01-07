import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const TAGS = [
  { id: "foh", label: "FOH" },
  { id: "mon", label: "MON" },
  { id: "playback", label: "Playback" },
  { id: "backline", label: "Backline" },
] as const;

interface RoleSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function RoleSelector({ selectedTags, onTagsChange }: RoleSelectorProps) {
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
                onTagsChange(
                  checked
                    ? [...selectedTags, tag.id]
                    : selectedTags.filter((t) => t !== tag.id)
                );
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