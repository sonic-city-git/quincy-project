import { Users } from "lucide-react";

interface HeaderCrewIconProps {
  needsCrew: boolean;
}

export function HeaderCrewIcon({ needsCrew }: HeaderCrewIconProps) {
  if (!needsCrew) return null;
  
  return <Users className="h-6 w-6 text-muted-foreground" />;
}