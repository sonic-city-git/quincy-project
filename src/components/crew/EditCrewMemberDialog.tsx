import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package } from "lucide-react";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { CrewMember } from "@/types/crew";

const TAGS = [
  { id: "foh", label: "FOH" },
  { id: "mon", label: "MON" },
  { id: "playback", label: "Playback" },
  { id: "backline", label: "Backline" },
] as const;

interface EditCrewMemberDialogProps {
  selectedCrew: CrewMember[];
  onEditCrewMember: (editedMember: CrewMember) => void;
}

export function EditCrewMemberDialog({ selectedCrew, onEditCrewMember }: EditCrewMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // We only edit one crew member at a time, even if multiple are selected
  const crewMember = selectedCrew[0];

  useEffect(() => {
    if (crewMember) {
      const tags = crewMember.role.split(", ").map(tag => tag.toLowerCase());
      setSelectedTags(tags);
    }
  }, [crewMember]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const [firstName, lastName] = crewMember.name.split(" ");
    
    const editedMember: CrewMember = {
      id: crewMember.id,
      name: `${formData.get("firstName") || firstName} ${formData.get("lastName") || lastName}`,
      role: selectedTags.join(", "),
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      folder: formData.get("folder") as string,
    };

    onEditCrewMember(editedMember);
    setOpen(false);
  };

  if (!crewMember) return null;

  const [firstName, lastName] = crewMember.name.split(" ");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          EDIT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Crew Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                defaultValue={firstName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                defaultValue={lastName}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+47 123 45 678"
              defaultValue={crewMember.phone}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john@example.com"
              defaultValue={crewMember.email}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="folder">Folder</Label>
            <Select name="folder" defaultValue={crewMember.folder}>
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sonic City">Sonic City</SelectItem>
                <SelectItem value="Freelance">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <div className="flex flex-wrap gap-4">
              {TAGS.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={(checked) => {
                      setSelectedTags(prev =>
                        checked
                          ? [...prev, tag.id]
                          : prev.filter(t => t !== tag.id)
                      );
                    }}
                  />
                  <Label htmlFor={tag.id} className="text-sm font-normal">
                    {tag.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" className="mt-4">Save changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}