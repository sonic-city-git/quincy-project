import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCrew } from "@/hooks/useCrew";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface OwnerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export function OwnerSelect({ value, onChange, error, required, className }: OwnerSelectProps) {
  // Use the Sonic City folder ID directly
  const sonicCityFolderId = "34f3469f-02bd-4ecf-82f9-11a4e88c2d77";
  const { crew, loading } = useCrew(sonicCityFolderId);
  
  // Filter out the dev@soniccity.no email
  const filteredCrew = crew?.filter(member => member.email !== 'dev@soniccity.no') || [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading}
        required={required}
      >
        <SelectTrigger 
          className={cn(
            "flex items-center gap-3 px-3 py-2 h-auto min-h-[2.5rem]", 
            error ? "border-red-500" : "", 
            className
          )}
        >
          {value && filteredCrew.find(member => member.id === value) && (
            <Avatar className="h-6 w-6">
              {filteredCrew.find(member => member.id === value)?.avatar_url ? (
                <AvatarImage 
                  src={filteredCrew.find(member => member.id === value)?.avatar_url} 
                  alt={filteredCrew.find(member => member.id === value)?.name || ''} 
                />
              ) : (
                <AvatarFallback>
                  {getInitials(filteredCrew.find(member => member.id === value)?.name || '')}
                </AvatarFallback>
              )}
            </Avatar>
          )}
          <SelectValue placeholder="Select owner" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[200px] w-full">
            <div className="p-1">
              {filteredCrew.map(member => {
                const initials = getInitials(member.name);

                return (
                  <SelectItem 
                    key={member.id} 
                    value={member.id}
                    className="flex items-center gap-3 py-2 px-3 cursor-pointer rounded-sm hover:bg-accent"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {member.avatar_url ? (
                          <AvatarImage 
                            src={member.avatar_url} 
                            alt={member.name} 
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                            {initials}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="truncate">{member.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}