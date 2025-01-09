export interface CrewMember {
  id: string;
  name: string;
  role: string | null;
  email: string;
  phone: string;
  folder: string;
}

export interface NewCrewMember {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  folder: string;
  tags: string[];
}

export interface CrewRole {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export const TAG_COLORS: { [key: string]: string } = {
  FOH: "bg-[#8B5CF6] text-white",
  MON: "bg-[#D946EF] text-white",
  PLAYBACK: "bg-[#F97316] text-white",
  BACKLINE: "bg-[#0EA5E9] text-white",
};