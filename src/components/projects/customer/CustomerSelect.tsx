import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomerSelectProps {
  projectId: string;
  initialCustomer: string;
  onCustomerSelect?: (customer: string | null) => void;
}

interface Customer {
  id: string;
  name: string;
}

async function fetchCustomers() {
  console.log('Starting to fetch customers...');
  const { data, error } = await supabase
    .from('customers')
    .select('id, name')
    .order('name');
    
  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
  
  console.log(`Fetched ${data?.length || 0} customers:`, data);
  return data || [];
}

export function CustomerSelect({ projectId, initialCustomer, onCustomerSelect }: CustomerSelectProps) {
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
  const { toast } = useToast();

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
    retry: 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    console.log('Initial customer:', initialCustomer);
    setSelectedCustomer(initialCustomer);
  }, [initialCustomer]);

  const handleCustomerChange = async (customerId: string) => {
    try {
      console.log('Handling customer change. Selected ID:', customerId);
      const selectedCustomerData = customers.find(c => c.id === customerId);
      
      if (!selectedCustomerData) {
        console.error('Selected customer not found in customers list');
        throw new Error('Selected customer not found');
      }

      console.log('Updating project with customer:', selectedCustomerData.name);
      if (projectId && projectId.length > 0) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ customer: selectedCustomerData.name })
          .eq('id', projectId);

        if (updateError) {
          console.error('Error updating project:', updateError);
          throw updateError;
        }
      }

      setSelectedCustomer(selectedCustomerData.name);
      onCustomerSelect?.(selectedCustomerData.name);
      console.log('Successfully updated customer to:', selectedCustomerData.name);
      
      if (projectId && projectId.length > 0) {
        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      }
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
    console.error('Error in CustomerSelect:', error);
    return (
      <div className="text-sm text-destructive">
        Error loading customers. Please try again later.
      </div>
    );
  }

  const currentCustomerId = customers.find(c => c.name === selectedCustomer)?.id;
  console.log('Current customer ID:', currentCustomerId, 'Selected customer:', selectedCustomer);

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Customer</p>
      <Select 
        value={currentCustomerId}
        onValueChange={handleCustomerChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading customers..." : "Select customer"} />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-[200px] overflow-y-auto">
            {customers.map((customer) => (
              <SelectItem 
                key={customer.id} 
                value={customer.id}
              >
                {customer.name}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
    </div>
  );
}