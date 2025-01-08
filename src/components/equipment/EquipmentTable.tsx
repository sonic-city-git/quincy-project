import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Equipment } from "@/types/equipment";
import { supabase } from "@/integrations/supabase/client";
import { Folder } from "@/types/folders";

interface EquipmentTableProps {
  equipment: Equipment[];
  selectedItems: string[];
  onSelectAll: () => void;
  onItemSelect: (id: string) => void;
}

export function EquipmentTable({ equipment, selectedItems, onSelectAll, onItemSelect }: EquipmentTableProps) {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    fetchFolders();

    const channel = supabase
      .channel('folders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'folders'
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
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching folders:', error);
      return;
    }

    setFolders(data);
  };

  const getFolderName = (folder_id: string | undefined): string => {
    const folder = folders.find(f => f.id === folder_id);
    if (!folder) return 'Uncategorized';

    // If the folder has a parent, include the parent name
    if (folder.parent_id) {
      const parent = folders.find(f => f.id === folder.parent_id);
      return parent ? `${parent.name} / ${folder.name}` : folder.name;
    }

    return folder.name;
  };

  const getFolderSortOrder = (folder_id: string | undefined): string => {
    const folder = folders.find(f => f.id === folder_id);
    if (!folder) return 'zzz_uncategorized'; // Make uncategorized items appear last

    // If the folder has a parent, use parent's name for sorting
    if (folder.parent_id) {
      const parent = folders.find(f => f.id === folder.parent_id);
      return parent ? `${parent.name}_${folder.name}` : folder.name;
    }

    return folder.name;
  };

  const groupedEquipment = equipment.reduce((acc, item) => {
    const folderName = getFolderName(item.folder_id);
    if (!acc[folderName]) {
      acc[folderName] = [];
    }
    acc[folderName].push(item);
    return acc;
  }, {} as Record<string, Equipment[]>);

  // Sort folders based on the folder structure
  const sortedFolderNames = Object.keys(groupedEquipment).sort((a, b) => {
    const itemA = equipment.find(item => getFolderName(item.folder_id) === a);
    const itemB = equipment.find(item => getFolderName(item.folder_id) === b);
    
    return getFolderSortOrder(itemA?.folder_id).localeCompare(getFolderSortOrder(itemB?.folder_id));
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedItems.length === equipment.length && equipment.length > 0}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFolderNames.map((folderName) => (
            <React.Fragment key={folderName}>
              <TableRow className="bg-zinc-900/50">
                <TableCell colSpan={5} className="py-2">
                  <h3 className="text-sm font-semibold text-zinc-200">{folderName}</h3>
                </TableCell>
              </TableRow>
              {groupedEquipment[folderName]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="w-[50px]">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => onItemSelect(item.id)}
                        aria-label={`Select ${item.name}`}
                      />
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{item.price}</TableCell>
                  </TableRow>
                ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}