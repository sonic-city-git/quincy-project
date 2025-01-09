import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";
import { EntitySelect } from "@/components/shared/EntitySelect";

interface FolderSelectProps {
  selectedFolder: string | null;
  onFolderSelect: (folderId: string | null) => void;
  required?: boolean;
  showAllFolders?: boolean;
}

export function FolderSelect({
  selectedFolder,
  onFolderSelect,
  required = false,
  showAllFolders = true,
}: FolderSelectProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFolders();

    const channel = supabase
      .channel('folders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_folders'
        },
        () => {
          fetchFolders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment_folders')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching folders:', error);
        return;
      }

      setFolders(data || []);
    } finally {
      setLoading(false);
    }
  };

  const allFolders = showAllFolders ? [{ id: 'all', name: 'All folders', parent_id: null, created_at: '', updated_at: '' }] : [];
  const flattenedFolders = [...allFolders, ...folders];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Folder</p>
      <EntitySelect
        entities={flattenedFolders}
        value={selectedFolder || 'all'}
        onValueChange={(value) => onFolderSelect(value === "all" ? null : value)}
        placeholder={loading ? "Loading folders..." : "Select folder"}
        isLoading={loading}
        required={required}
      />
    </div>
  );
}