import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderSelect } from "./shared/FolderSelect";
import { FolderManagement } from "./folders/FolderManagement";
import { useState } from "react";

interface EquipmentFolderSelectProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
}

export function EquipmentFolderSelect({
  selectedFolder,
  onFolderSelect,
}: EquipmentFolderSelectProps) {
  const [isManaging, setIsManaging] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <FolderSelect
        selectedFolder={selectedFolder}
        onFolderSelect={onFolderSelect}
        required={false}
        showAllFolders={true}
      />
      
      <Dialog open={isManaging} onOpenChange={setIsManaging}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Folders</DialogTitle>
          </DialogHeader>
          <FolderManagement
            folders={[]}
            onClose={() => setIsManaging(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}