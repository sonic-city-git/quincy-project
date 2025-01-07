import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectCalendar } from "@/components/events/ProjectCalendar";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProjectGeneralTabProps {
  projectId: string;
  initialOwner: string;
  initialCustomer: string;
  gigPrice: string;
  yearlyRevenue: string;
}

export const ProjectGeneralTab = ({ 
  projectId, 
  initialOwner, 
  initialCustomer, 
  gigPrice, 
  yearlyRevenue 
}: ProjectGeneralTabProps) => {
  const [sonicCityCrewMembers, setSonicCityCrewMembers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOwner, setSelectedOwner] = useState(initialOwner);
  const [selectedCustomer, setSelectedCustomer] = useState(initialCustomer);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSonicCityCrewMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('crew_members')
          .select('id, name')
          .eq('folder', 'Sonic City');

        if (error) throw error;
        setSonicCityCrewMembers(data || []);
      } catch (error) {
        console.error('Error fetching Sonic City crew members:', error);
        toast({
          title: "Error",
          description: "Failed to fetch crew members",
          variant: "destructive",
        });
      }
    };

    fetchSonicCityCrewMembers();
  }, [toast]);

  const handleOwnerChange = async (newOwnerName: string) => {
    try {
      // Find the crew member's ID based on their name
      const crewMember = sonicCityCrewMembers.find(crew => crew.name === newOwnerName);
      if (!crewMember) {
        throw new Error('Selected crew member not found');
      }

      // Update the project in Supabase
      const { error } = await supabase
        .from('projects')
        .update({ owner_id: crewMember.id })
        .eq('id', projectId);

      if (error) throw error;

      // Update local state
      setSelectedOwner(newOwnerName);
      
      toast({
        title: "Success",
        description: "Project owner updated successfully",
      });
    } catch (error) {
      console.error('Error updating project owner:', error);
      toast({
        title: "Error",
        description: "Failed to update project owner",
        variant: "destructive",
      });
    }
  };

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="p-4">
            <ProjectCalendar className="rounded-md border" />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Owner</p>
                <Select value={selectedOwner} onValueChange={handleOwnerChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {sonicCityCrewMembers.map((crew) => (
                      <SelectItem key={crew.id} value={crew.name}>
                        {crew.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator className="my-4" />
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Gig Price</p>
                <p className="text-base font-medium">{gigPrice}</p>
              </div>
              <Separator className="my-2" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Yearly Revenue</p>
                <p className="text-base font-medium">{yearlyRevenue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};