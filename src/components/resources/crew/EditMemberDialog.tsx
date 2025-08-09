import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCrewFolders } from "@/hooks/crew";
import { useCrewRoles } from "@/hooks/crew";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CrewMember } from "@/types/crew";
import { EditMemberForm } from "./edit/EditMemberForm";
import { DeleteMemberAlert } from "./edit/DeleteMemberAlert";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  folder_id: z.string().optional(),
  role_ids: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: CrewMember;
  onCrewMemberDeleted?: () => void;
}

export function EditMemberDialog({ 
  open, 
  onOpenChange, 
  member, 
  onCrewMemberDeleted 
}: EditMemberDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { folders = [], loading: foldersLoading } = useCrewFolders();
  const { roles = [], isLoading: rolesLoading } = useCrewRoles();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      folder_id: member.folder_id || "",
      role_ids: member.roles || [],
    },
  });

  const handleDelete = async () => {
    setIsPending(true);
    try {
      const { error: rolesError } = await supabase
        .from('crew_member_roles')
        .delete()
        .eq('crew_member_id', member.id);

      if (rolesError) throw rolesError;

      const { error: deleteError } = await supabase
        .from('crew_members')
        .delete()
        .eq('id', member.id);

      if (deleteError) throw deleteError;

      queryClient.invalidateQueries({ queryKey: ['crew'] });
      onOpenChange(false);
      onCrewMemberDeleted?.();
      toast.success("Crew member deleted successfully");
    } catch (error: any) {
      console.error("Error deleting crew member:", error);
      toast.error(error.message || "Failed to delete crew member");
    } finally {
      setIsPending(false);
      setShowDeleteAlert(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      const { error: updateError } = await supabase
        .from('crew_members')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          folder_id: data.folder_id || null,
        })
        .eq('id', member.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('crew_member_roles')
        .delete()
        .eq('crew_member_id', member.id);

      if (deleteError) throw deleteError;

      if (data.role_ids && data.role_ids.length > 0) {
        const { error: rolesError } = await supabase
          .from('crew_member_roles')
          .insert(
            data.role_ids.map(roleId => ({
              crew_member_id: member.id,
              role_id: roleId,
            }))
          );

        if (rolesError) throw rolesError;
      }

      queryClient.invalidateQueries({ queryKey: ['crew'] });
      onOpenChange(false);
      form.reset();
      toast.success("Crew member updated successfully");
    } catch (error: any) {
      console.error("Error updating crew member:", error);
      toast.error(error.message || "Failed to update crew member");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Crew Member</DialogTitle>
            <DialogDescription>
              Make changes to {member.name}'s information below.
            </DialogDescription>
          </DialogHeader>
          <EditMemberForm
            form={form}
            onSubmit={onSubmit}
            isPending={isPending}
            folders={folders || []}
            foldersLoading={foldersLoading}
            roles={roles || []}
            rolesLoading={rolesLoading}
            onDelete={() => setShowDeleteAlert(true)}
          />
        </DialogContent>
      </Dialog>

      <DeleteMemberAlert
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        onConfirm={handleDelete}
        isPending={isPending}
        memberName={member.name}
      />
    </>
  );
}