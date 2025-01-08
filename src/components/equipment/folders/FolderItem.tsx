import { useState } from "react";
import { Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the folder
                    {hasChildren ? " and all its subfolders" : ""}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(folder.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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