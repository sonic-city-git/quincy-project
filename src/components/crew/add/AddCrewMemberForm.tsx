import { Button } from "@/components/ui/button";
import { NewCrewMember } from "@/types/crew";
import { BasicInfoFields } from "./BasicInfoFields";
import { RoleSelector } from "../shared/RoleSelector";
import { useState } from "react";

interface AddCrewMemberFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function AddCrewMemberForm({ onSubmit }: AddCrewMemberFormProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newMember: NewCrewMember = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      folder: formData.get("folder") as string,
      role_id: selectedRoleId,
    };

    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <BasicInfoFields />
      <RoleSelector 
        selectedRoleId={selectedRoleId}
        onRoleChange={setSelectedRoleId}
      />
      <Button type="submit" className="mt-4">Add crew member</Button>
    </form>
  );
}