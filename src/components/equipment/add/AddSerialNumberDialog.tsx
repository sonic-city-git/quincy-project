import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";

interface AddSerialNumberDialogProps {
  onAddSerialNumber: (serialNumber: string, notes: string) => void;
}

export function AddSerialNumberDialog({ onAddSerialNumber }: AddSerialNumberDialogProps) {
  const [open, setOpen] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up to parent form
    if (serialNumber.trim()) {
      onAddSerialNumber(serialNumber.trim(), notes.trim());
      setSerialNumber("");
      setNotes("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Serial Number
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Serial Number</DialogTitle>
          <DialogDescription>
            Add a new serial number for this equipment
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input
              id="serialNumber"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="Enter serial number"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes"
            />
          </div>
          <Button type="submit">Add Serial Number</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}