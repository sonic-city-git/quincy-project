export type CrewMemberRole = {
  id: string;
  crew_member_id: string;
  role_id: string;
  created_at: string;
};

export type CrewMemberRoleInsert = Omit<CrewMemberRole, 'id' | 'created_at'>;
export type CrewMemberRoleUpdate = Partial<CrewMemberRoleInsert>;