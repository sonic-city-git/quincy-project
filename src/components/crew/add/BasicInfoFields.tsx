import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface BasicInfoFieldsProps {
  defaultValues?: {
    name: string;
    email: string;
    phone: string;
    crew_folder: {
      id: string;
      name: string;
      created_at: string;
    } | null;
  };
}

interface FolderData {
  id: string;
  data: Json;
  name: string;
  created_at: string;
}

const getFolderPriority = (folderName: string): number => {
  const name = folderName.toLowerCase();
  if (name === 'sonic city') return 1;
  if (name === 'associates') return 2;
  if (name === 'freelance') return 3;
  return 4;
};

export function BasicInfoFields({ defaultValues }: BasicInfoFieldsProps) {
  const { data: folders } = useQuery({
    queryKey: ['crew-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_folders')
        .select('*');
      
      if (error) throw error;

      return (data as FolderData[]).sort((a, b) => {
        const priorityA = getFolderPriority((a.data as { name: string }).name);
        const priorityB = getFolderPriority((b.data as { name: string }).name);
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        return (a.data as { name: string }).name.localeCompare((b.data as { name: string }).name);
      });
    },
  });

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="John Doe"
          defaultValue={defaultValues?.name}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+47 123 45 678"
          defaultValue={defaultValues?.phone}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          defaultValue={defaultValues?.email}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="crew_folder">Folder</Label>
        <Select 
          name="crew_folder" 
          defaultValue={defaultValues?.crew_folder?.id} 
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select folder" />
          </SelectTrigger>
          <SelectContent>
            {folders?.map((folder) => (
              <SelectItem 
                key={folder.id} 
                value={JSON.stringify({
                  id: folder.id,
                  name: folder.name,
                  created_at: folder.created_at
                })}
              >
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}