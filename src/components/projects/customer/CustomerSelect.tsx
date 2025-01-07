import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface CustomerSelectProps {
  projectId: string;
  initialCustomer: string;
}

interface Customer {
  id: string;
  name: string;
}

async function fetchCustomers() {
  console.log('Fetching customers...');
  const { data, error } = await supabase
    .from('customers')
    .select('id, name')
    .order('name');
    
  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
  
  if (!data) {
    console.log('No customers found');
    return [];
  }
  
  console.log('Fetched customers:', data);
  return data;
}

export function CustomerSelect({ projectId, initialCustomer }: CustomerSelectProps) {
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
  const { toast } = useToast();

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  useEffect(() => {
    setSelectedCustomer(initialCustomer);
  }, [initialCustomer]);

  const handleCustomerChange = async (customerId: string) => {
    try {
      const selectedCustomerData = customers.find(c => c.id === customerId);
      if (!selectedCustomerData) {
        throw new Error('Selected customer not found');
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update({ customer: selectedCustomerData.name })
        .eq('id', projectId);

      if (updateError) throw updateError;

      setSelectedCustomer(selectedCustomerData.name);
      
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

  if (error) {
    console.error('Error fetching customers:', error);
    return (
      <div className="text-sm text-destructive">
        Error loading customers. Please try again later.
      </div>
    );
  }

  const currentCustomerId = customers.find(c => c.name === selectedCustomer)?.id;

  return (
    <div className="space-y-2 relative">
      <p className="text-sm text-muted-foreground">Customer</p>
      <Select 
        value={currentCustomerId}
        onValueChange={handleCustomerChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[240px] h-12 bg-zinc-900 text-white border-zinc-700">
          <SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} />
        </SelectTrigger>
        <SelectContent 
          className="bg-zinc-900 border border-zinc-700 min-w-[240px] z-[100]"
          position="popper"
          align="start"
          sideOffset={5}
          style={{ position: 'relative', zIndex: 100 }}
        >
          {customers.map((customer) => (
            <SelectItem 
              key={customer.id} 
              value={customer.id}
              className="text-white hover:bg-zinc-800 cursor-pointer py-3 px-4"
            >
              {customer.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}