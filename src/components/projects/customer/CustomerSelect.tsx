import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomerSelectProps {
  projectId: string;
  initialCustomer: string;
}

export function CustomerSelect({ projectId, initialCustomer }: CustomerSelectProps) {
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
  const { toast } = useToast();

  const handleCustomerChange = async (newCustomer: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ customer: newCustomer })
        .eq('id', projectId);

      if (error) throw error;

      setSelectedCustomer(newCustomer);
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Customer</p>
      <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select customer" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Universal Music">Universal Music</SelectItem>
          <SelectItem value="Sony Music">Sony Music</SelectItem>
          <SelectItem value="Warner Music">Warner Music</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}