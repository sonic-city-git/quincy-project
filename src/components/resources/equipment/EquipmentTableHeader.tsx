import { COMPONENT_CLASSES, cn } from "@/design-system";

export function EquipmentTableHeader() {
  return (
    <div className={cn("grid grid-cols-[2fr_120px_100px] sm:grid-cols-[2fr_120px_80px_100px] gap-3 sm:gap-4 p-3 sm:p-4 font-semibold text-sm", COMPONENT_CLASSES.table.header)}>
      <div>Name</div>
      <div>Code</div>
      <div className="hidden sm:block text-right">Stock</div>
      <div className="text-right">Price</div>
    </div>
  );
}