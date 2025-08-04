import { COMPONENT_CLASSES, cn } from "@/design-system";

export function CrewTableHeader() {
  return (
    <div className={cn("grid grid-cols-[2fr_200px_120px] sm:grid-cols-[2fr_200px_160px_120px] gap-3 sm:gap-4 p-3 sm:p-4 font-semibold text-sm", COMPONENT_CLASSES.table.header)}>
      <div>Name</div>
      <div>Roles</div>
      <div className="hidden sm:block">Email</div>
      <div className="hidden sm:block">Phone</div>
    </div>
  );
}