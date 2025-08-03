import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResourceType } from "../types/resource";
import { AddMemberDialog } from "@/components/crew/AddMemberDialog";
import { AddEquipmentDialog } from "@/components/equipment/AddEquipmentDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AddResourceDialogProps {
  defaultType?: ResourceType;
}

export function AddResourceDialog({ defaultType }: AddResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ResourceType | null>(defaultType || null);
  const [showTypeDialog, setShowTypeDialog] = useState(true);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset state when dialog closes
      setSelectedType(defaultType || null);
      setShowTypeDialog(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add Resource</Button>
      </DialogTrigger>

      {/* Type Selection Dialog */}
      <DialogContent className="sm:max-w-[425px]">
        {showTypeDialog ? (
          <>
            <DialogHeader>
              <DialogTitle>What type of resource?</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <RadioGroup
                defaultValue={defaultType}
                onValueChange={(value) => {
                  setSelectedType(value as ResourceType);
                  setShowTypeDialog(false);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={ResourceType.CREW} id="crew" />
                  <Label htmlFor="crew">Crew Member</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={ResourceType.EQUIPMENT} id="equipment" />
                  <Label htmlFor="equipment">Equipment</Label>
                </div>
              </RadioGroup>
            </div>
          </>
        ) : (
          // Show the appropriate add dialog based on selected type
          selectedType === ResourceType.CREW ? (
            <AddMemberDialog
              open={true}
              onOpenChange={(isOpen) => {
                if (!isOpen) handleOpenChange(false);
              }}
            />
          ) : (
            <AddEquipmentDialog
              open={true}
              onOpenChange={(isOpen) => {
                if (!isOpen) handleOpenChange(false);
              }}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}