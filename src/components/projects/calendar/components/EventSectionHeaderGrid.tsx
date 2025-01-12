import { ReactNode } from "react";

interface EventSectionHeaderGridProps {
  children: ReactNode;
}

export function EventSectionHeaderGrid({ children }: EventSectionHeaderGridProps) {
  return (
    <div className="grid grid-cols-[100px_165px_30px_30px_30px_1fr_100px_40px_40px] gap-2 items-center px-3">
      {children}
    </div>
  );
}