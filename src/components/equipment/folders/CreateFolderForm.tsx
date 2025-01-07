import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Folder } from "@/types/folders";

interface CreateFolderFormProps {
  folders: Folder[];
  newFolderName: string;
  selectedParentId: string | null;
  onNameChange: (name: string) => void;
  onParentChange: (parentId: string | null) => void;
  onSubmit: () => void;
}

export function CreateFolderForm({
  folders,
  newFolderName,
  selectedParentId,
  onNameChange,
  onParentChange,
  onSubmit
}: CreateFolderFormProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="New folder name"
        value={newFolderName}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-8"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSubmit();
          }
        }}
      />
      <Select
        value={selectedParentId || "none"}
        onValueChange={(value) => onParentChange(value === "none" ? null : value)}
      >
        <SelectTrigger className="w-[180px] h-8">
          <SelectValue placeholder="Parent folder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No parent</SelectItem>
          {folders.map((folder) => (
            <SelectItem key={folder.id} value={folder.id}>
              {folder.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        size="sm" 
        onClick={onSubmit} 
        disabled={!newFolderName.trim()}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add
      </Button>
    </div>
  );
}