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
import { CrewMember } from "@/types/crew";
import { DeleteCrewMemberButton } from "./DeleteCrewMemberButton";
import { RoleSelector } from "../shared/RoleSelector";
import { useState } from "react";

interface EditCrewMemberFormProps {
  crewMember: CrewMember;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export function EditCrewMemberForm({
  crewMember,
  onSubmit,
  onDelete,
}: EditCrewMemberFormProps) {
  const [firstName, lastName] = crewMember.name.split(" ");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(crewMember.role_id);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const editedMember: CrewMember = {
      id: crewMember.id,
      name: `${formData.get("firstName")} ${formData.get("lastName")}`,
      role_id: selectedRoleId,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      folder: formData.get("folder") as string,
    };

    onSubmit(e);
  };

  return (
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
      <RoleSelector 
        selectedRoleId={selectedRoleId}
        onRoleChange={setSelectedRoleId}
      />
      <div className="flex justify-between items-center">
        <Button type="submit">Save Changes</Button>
        <DeleteCrewMemberButton onDelete={onDelete} />
      </div>
    </form>
  );
}