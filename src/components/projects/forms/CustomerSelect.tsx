import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCustomers } from "@/hooks/useCustomers";

interface CustomerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export function CustomerSelect({ value, onChange, error, required }: CustomerSelectProps) {
  const { customers, loading } = useCustomers(true);

  return (
    <div className="space-y-2">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={loading}
        required={required}
      >
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Select customer" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[200px] w-full">
            <div className="p-1">
              {customers.map(customer => (
                <SelectItem 
                  key={customer.id} 
                  value={customer.id}
                  className="cursor-pointer rounded-sm hover:bg-accent"
                >
                  {customer.name}
                </SelectItem>
              ))}
            </div>
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}