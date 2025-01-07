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
import { Plus } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface AddEquipmentDialogProps {
  onAddEquipment: (newEquipment: any) => void;
}

export function AddEquipmentDialog({ onAddEquipment }: AddEquipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [hasSerialNumbers, setHasSerialNumbers] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const serialNumbersList = hasSerialNumbers 
      ? serialNumbers
      : [];

    const newEquipment = {
      code: formData.get("code"),
      name: formData.get("name"),
      price: formData.get("price"),
      value: formData.get("value"),
      weight: formData.get("weight"),
      stock: hasSerialNumbers ? serialNumbersList.length : Number(formData.get("stock")),
      serialNumbers: serialNumbersList,
      id: Math.random().toString(36).substr(2, 9),
    };

    onAddEquipment(newEquipment);
    setOpen(false);
    setSerialNumbers([]);
    setHasSerialNumbers(false);
  };

  const handleSerialNumbersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const numbers = e.target.value.split('\n').filter(n => n.trim() !== '');
    setSerialNumbers(numbers);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add equipment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Equipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              placeholder="4U-AIR"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Peli Air with 4U"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              placeholder="60.80"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Book Value</Label>
            <Input
              id="value"
              name="value"
              type="number"
              step="0.01"
              placeholder="1500.00"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              placeholder="10.50"
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasSerialNumbers"
              checked={hasSerialNumbers}
              onCheckedChange={(checked) => setHasSerialNumbers(checked as boolean)}
            />
            <Label htmlFor="hasSerialNumbers" className="text-sm font-normal">
              This equipment requires serial numbers
            </Label>
          </div>
          {hasSerialNumbers ? (
            <div className="grid gap-2">
              <Label htmlFor="serialNumbers">Serial Numbers (one per line)</Label>
              <Textarea
                id="serialNumbers"
                placeholder="Enter serial numbers..."
                className="h-[100px]"
                value={serialNumbers.join('\n')}
                onChange={handleSerialNumbersChange}
                required={hasSerialNumbers}
              />
              <p className="text-sm text-muted-foreground">
                Stock: {serialNumbers.length} items
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                placeholder="5"
                required={!hasSerialNumbers}
              />
            </div>
          )}
          <Button type="submit" className="mt-4">Add equipment</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}