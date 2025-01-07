import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  newFolderName,
  onNameChange,
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