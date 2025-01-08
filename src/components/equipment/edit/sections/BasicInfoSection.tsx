import { Equipment } from "@/types/equipment";
import { BasicEquipmentFields } from "../../add/BasicEquipmentFields";

interface BasicInfoSectionProps {
  equipment: Equipment;
}

export function BasicInfoSection({ equipment }: BasicInfoSectionProps) {
  return (
    <BasicEquipmentFields 
      defaultValues={{
        code: equipment.code,
        name: equipment.name,
        price: equipment.price,
        value: equipment.value,
        weight: equipment.weight,
      }}
      required 
    />
  );
}