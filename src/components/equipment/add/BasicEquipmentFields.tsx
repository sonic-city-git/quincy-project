import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BasicEquipmentFieldsProps {
  required?: boolean;
  defaultValues?: {
    code: string;
    name: string;
    price: string;
    value: string;
    weight: string;
  };
}

export function BasicEquipmentFields({ 
  required = false,
  defaultValues
}: BasicEquipmentFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          placeholder="4U-AIR"
          required={required}
          defaultValue={defaultValues?.code}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Peli Air with 4U"
          required={required}
          defaultValue={defaultValues?.name}
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
          required={required}
          defaultValue={defaultValues?.price}
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
          required={required}
          defaultValue={defaultValues?.value}
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
          required={required}
          defaultValue={defaultValues?.weight}
        />
      </div>
    </>
  );
}