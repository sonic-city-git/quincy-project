import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CrewMember, CrewRole } from "@/types/crew";

interface CrewMemberSelectProps {
  projectRoleId: string;
  selectedCrewMember: CrewMember | null;
  onSelect: (projectRoleId: string, crewMemberId: string) => void;
  roleName: string;
}

export function CrewMemberSelect({ 
  projectRoleId, 
  selectedCrewMember, 
  onSelect,
  roleName 
}: CrewMemberSelectProps) {
  const { data: crewMembers, isLoading: isLoadingCrew, error: crewError } = useQuery({
    queryKey: ['crew-members-by-role', roleName],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from('crew_members')
        .select('*');
      
      if (membersError) throw membersError;
      
      return members.map(member => ({
        ...member,
        roles: Array.isArray(member.roles) 
          ? (member.roles as any[]).map(role => ({
              id: role.id,
              name: role.name,
              color: role.color,
              created_at: role.created_at
            } as CrewRole)) 
          : []
      })).filter(member => 
        member.roles.some(role => role.name === roleName)
      ) as CrewMember[];
    },
    retry: 3,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (replaces cacheTime)
  });

  const { data: folders, isLoading: isLoadingFolders, error: foldersError } = useQuery({
    queryKey: ['crew-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_folders')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const getFolderName = (folderId: string) => {
    if (!folders) return '';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || '';
  };

  if (isLoadingCrew || isLoadingFolders) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="w-[200px] justify-between opacity-50"
        disabled
      >
        Loading...
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  if (crewError || foldersError) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="w-[200px] justify-between text-red-500"
        disabled
      >
        Error loading data
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  const availableCrew = crewMembers?.sort((a, b) => {
    const folderA = getFolderName(a.folder_id);
    const folderB = getFolderName(b.folder_id);
    if (folderA === "Sonic City" && folderB !== "Sonic City") return -1;
    if (folderA !== "Sonic City" && folderB === "Sonic City") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-[200px] justify-between"
        >
          {selectedCrewMember ? (
            <span>
              {selectedCrewMember.name} 
              {getFolderName(selectedCrewMember.folder_id) === "Sonic City" && "⭐"}
            </span>
          ) : (
            "Select crew member"
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {availableCrew?.map((crew) => (
          <DropdownMenuItem 
            key={crew.id}
            onClick={() => onSelect(projectRoleId, crew.id)}
          >
            {crew.name} {getFolderName(crew.folder_id) === "Sonic City" && "⭐"}
          </DropdownMenuItem>
        ))}
        {(!availableCrew || availableCrew.length === 0) && (
          <DropdownMenuItem disabled>
            No crew members available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
