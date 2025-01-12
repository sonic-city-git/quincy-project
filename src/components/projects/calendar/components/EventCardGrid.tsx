import { ReactNode } from "react";

interface EventCardGridProps {
  children: ReactNode;
}

export function EventCardGrid({ children }: EventCardGridProps) {
  return (
    <div className="grid grid-cols-[100px_140px_30px_30px_30px_30px_150px_100px_40px_40px] gap-2 items-center min-h-[48px]">
      {children}
    </div>
  );
}