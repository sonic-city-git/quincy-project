import { useState } from "react";
import { Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder } from "@/types/folders";

interface FolderItemProps {
  folder: Folder;
  level: number;
  isExpanded: boolean;
  onToggle: (folderId: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddSubfolder: (parentId: string) => void;
  showAddSubfolder: boolean;
  children?: React.ReactNode;
}

export function FolderItem({
  folder,
  level,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddSubfolder,
  showAddSubfolder,
  children
}: FolderItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(folder.name);
  const hasChildren = children !== undefined && children !== false;

  const handleUpdate = () => {
    onUpdate(folder.id, editedName);
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2" style={{ marginLeft: `${level * 20}px` }}>
        {/* Only show collapse arrows for folders that have children */}
        {level === 0 && hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-4 w-4 hover:bg-transparent"
            onClick={() => onToggle(folder.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-4" />
        )}
        
        {isEditing ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleUpdate();
              }
            }}
            autoFocus
            className="h-8"
          />
        ) : (
          <>
            <span className="flex-1">{folder.name}</span>
            {showAddSubfolder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddSubfolder(folder.id)}
              >
                Add Subfolder
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(folder.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {children}
        </div>
      )}
    </div>
  );
}