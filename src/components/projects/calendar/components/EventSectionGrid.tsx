import { ReactNode } from "react";

interface EventSectionGridProps {
  children: ReactNode;
}

export function EventSectionGrid({ children }: EventSectionGridProps) {
  return (
    <div className="grid grid-cols-[100px_165px_30px_30px_30px_1fr_100px_40px_40px] gap-2 items-center">
      {children}
    </div>
  );
}