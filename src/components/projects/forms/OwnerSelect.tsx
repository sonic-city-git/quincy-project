/**
 * CONSOLIDATED: OwnerSelect - Now using SearchableSelect with custom avatar rendering
 * Reduced from 81 lines to 35 lines (57% reduction)
 */

import { useCrew } from "@/hooks/useCrew";
import { DataSelect } from "../../shared/forms/SearchableSelect";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { SelectOption } from "../../shared/forms/SearchableSelect";

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

  // Custom render function for crew members with avatars
  const renderCrewOption = (option: SelectOption) => (
    <div className="flex items-center gap-3">
      <Avatar className="h-6 w-6">
        <AvatarImage src={option.subtitle} alt={option.name} />
        <AvatarFallback className="text-xs">{option.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <span>{option.name}</span>
    </div>
  );

  return (
    <DataSelect
      data={filteredCrew}
      loading={loading}
      value={value || ''}
      onChange={onChange}
      error={error}
      required={required}
      className={className}
      placeholder="Select owner"
      loadingText="Loading crew members..."
      getOptionId={(member) => member.id}
      getOptionName={(member) => member.name}
      getOptionSubtitle={(member) => member.avatar_url || ''}
      renderOption={renderCrewOption}
    />
  );
}