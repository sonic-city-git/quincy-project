import { ReactNode } from "react";

interface EventSectionHeaderGridProps {
  children: ReactNode;
}

export function EventSectionHeaderGrid({ children }: EventSectionHeaderGridProps) {
  return (
    <div className="w-full grid grid-cols-[100px_165px_30px_30px_30px_30px_150px_100px_40px_40px] gap-2 items-center">
      {children}
    </div>
  );
}