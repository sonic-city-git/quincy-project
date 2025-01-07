import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CrewMember } from "@/types/crew";
import { RoleSelector } from "./RoleSelector";

interface EditCrewMemberFormProps {
  crewMember: CrewMember;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export function EditCrewMemberForm({
  crewMember,
  selectedTags,
  onTagsChange,
  onSubmit,
  onDelete,
}: EditCrewMemberFormProps) {
  const [firstName, lastName] = crewMember.name.split(" ");

  return (
    <form onSubmit={onSubmit} className="grid gap-4 py-4">
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
      <RoleSelector selectedTags={selectedTags} onTagsChange={onTagsChange} />
      <DeleteCrewMemberButton onDelete={onDelete} />
    </form>
  );
}