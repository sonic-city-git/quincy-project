import { ReactNode } from "react";

interface EventSectionHeaderGridProps {
  children: ReactNode;
}

export function EventSectionHeaderGrid({ children }: EventSectionHeaderGridProps) {
  return (
    <div className="grid grid-cols-[100px_140px_30px_30px_30px_30px_150px_1fr_1fr_40px] gap-2 items-center min-h-[48px]">
      {children}
    </div>
  );
}