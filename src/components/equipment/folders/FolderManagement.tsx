import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder } from "@/types/folders";
import { FolderItem } from "./FolderItem";
import { CreateFolderForm } from "./CreateFolderForm";
import { useFolderOperations } from "@/hooks/useFolderOperations";
import { useFolderState } from "@/hooks/useFolderState";

interface FolderManagementProps {
  folders: Folder[];
  onClose: () => void;
}

export function FolderManagement({ folders: initialFolders, onClose }: FolderManagementProps) {
  const {
    newFolderName,
    setNewFolderName,
    handleAddFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleAddSubfolder,
  } = useFolderOperations();

  const {
    folders,
    expandedFolders,
    toggleFolder,
  } = useFolderState(initialFolders);

  const renderFolderItem = (folder: Folder, level: number = 0) => {
    const children = folders.filter(f => f.parent_id === folder.id);
    
    return (
      <FolderItem
        key={folder.id}
        folder={folder}
        level={level}
        isExpanded={expandedFolders[folder.id]}
        onToggle={toggleFolder}
        onUpdate={handleUpdateFolder}
        onDelete={handleDeleteFolder}
        onAddSubfolder={handleAddSubfolder}
        showAddSubfolder={level === 0}
      >
        {children.length > 0 && children.map(child => renderFolderItem(child, level + 1))}
      </FolderItem>
    );
  };

  // Get only root folders (no parent)
  const rootFolders = folders.filter(f => !f.parent_id);

  return (
    <div className="space-y-4">
      <CreateFolderForm
        newFolderName={newFolderName}
        onNameChange={setNewFolderName}
        onSubmit={handleAddFolder}
      />
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {rootFolders.map(folder => renderFolderItem(folder))}
        </div>
      </ScrollArea>
    </div>
  );
}