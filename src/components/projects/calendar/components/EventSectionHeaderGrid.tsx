import { ReactNode } from "react";

interface EventSectionHeaderGridProps {
  children: ReactNode;
}

export function EventSectionHeaderGrid({ children }: EventSectionHeaderGridProps) {
  return (
    <div className="grid grid-cols-[auto_165px_30px_30px_30px_1fr_100px_80px] gap-2 items-center">
      {children}
    </div>
  );
}