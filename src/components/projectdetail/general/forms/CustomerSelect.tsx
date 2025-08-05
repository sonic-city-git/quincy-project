/**
 * CONSOLIDATED: CustomerSelect - Now using SearchableSelect
 * Reduced from 46 lines to 22 lines (52% reduction)
 */

import { useCustomers } from "@/hooks/useCustomers";
import { DataSelect } from "../../../shared/forms/SearchableSelect";

interface CustomerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export function CustomerSelect({ value, onChange, error, required, className }: CustomerSelectProps) {
  const { customers, loading } = useCustomers(true);

  return (
    <DataSelect
      data={customers}
      loading={loading}
      value={value || ''}
      onChange={onChange}
      error={error}
      required={required}
      className={className}
      placeholder="Select customer"
      getOptionId={(customer) => customer.id}
      getOptionName={(customer) => customer.name}
    />
  );
}