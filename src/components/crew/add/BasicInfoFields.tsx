import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  folders: {
    id: string;
    name: string;
    created_at: string;
  }[];
}

const getFolderPriority = (folderName: string): number => {
  const name = folderName.toLowerCase();
  if (name === 'sonic city') return 1;
  if (name === 'associates') return 2;
  if (name === 'freelance') return 3;
  return 4;
};

export function BasicInfoFields({ defaultValues, folders }: BasicInfoFieldsProps) {
  const sortedFolders = [...folders].sort((a, b) => {
    const priorityA = getFolderPriority(a.name);
    const priorityB = getFolderPriority(b.name);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    return a.name.localeCompare(b.name);
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
          defaultValue={defaultValues?.crew_folder?.id ? JSON.stringify({
            id: defaultValues.crew_folder.id,
            name: defaultValues.crew_folder.name,
            created_at: defaultValues.crew_folder.created_at
          }) : undefined}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select folder" />
          </SelectTrigger>
          <SelectContent>
            {sortedFolders.map((folder) => (
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