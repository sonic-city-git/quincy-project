import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BasicEquipmentFieldsProps {
  required?: boolean;
  defaultValues?: {
    code?: string;
    name?: string;
    price?: string;
    value?: string;
    weight?: string;
    notes?: string;
  };
}

export function BasicEquipmentFields({ required = false, defaultValues }: BasicEquipmentFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          placeholder="Enter equipment code"
          defaultValue={defaultValues?.code}
          required={required}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter equipment name"
          defaultValue={defaultValues?.name}
          required={required}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          placeholder="Enter price"
          defaultValue={defaultValues?.price}
          required={required}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="value">Book Value</Label>
        <Input
          id="value"
          name="value"
          type="number"
          step="0.01"
          placeholder="Enter book value"
          defaultValue={defaultValues?.value}
          required={required}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          step="0.01"
          placeholder="Enter weight in kilograms"
          defaultValue={defaultValues?.weight}
          required={required}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaultValues?.notes}
          placeholder="Add any additional notes here..."
          className="resize-none"
          rows={3}
        />
      </div>
    </>
  );
}