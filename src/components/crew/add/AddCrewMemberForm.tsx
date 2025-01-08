import { Button } from "@/components/ui/button";
import { NewCrewMember } from "@/types/crew";
import { BasicInfoFields } from "./BasicInfoFields";
import { RoleSelector } from "../shared/RoleSelector";

interface AddCrewMemberFormProps {
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function AddCrewMemberForm({ 
  selectedTags, 
  setSelectedTags, 
  onSubmit 
}: AddCrewMemberFormProps) {
  return (
    <form onSubmit={onSubmit} className="grid gap-4 py-4">
      <BasicInfoFields />
      <RoleSelector 
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />
      <Button type="submit" className="mt-4">Add crew member</Button>
    </form>
  );
}