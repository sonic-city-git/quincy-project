import { useState, useCallback, useRef, useEffect } from "react";
import { addDays, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Equipment } from "@/types/equipment";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { isItemInFolder } from "@/utils/folderUtils";
import { AddEquipmentDialog } from "./equipment/AddEquipmentDialog";
import { EquipmentTimeline } from "./equipment/EquipmentTimeline";
import { EquipmentFolderSelect } from "./equipment/EquipmentFolderSelect";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentSelectionHeader } from "./equipment/EquipmentSelectionHeader";
import { supabase } from "@/integrations/supabase/client";

export function EquipmentList() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchEquipment = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('*');

      if (error) {
        console.error('Error fetching equipment:', error);
        toast({
          title: "Error",
          description: "Failed to load equipment data",
          variant: "destructive",
        });
        return;
      }

      const formattedEquipment: Equipment[] = data.map(item => ({
        id: item.id,
        code: item.Code || '',
        name: item.Name || '',
        price: item.Price?.toString() || '0',
        value: item["Book Value"]?.toString() || '0',
        weight: item.Weight?.toString() || '0',
        stock: item.Stock || 0,
        folderId: item.Folder || undefined,
      }));

      setEquipment(formattedEquipment);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();

    // Set up real-time subscription
    const channel = supabase
      .channel('equipment_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchEquipment(); // Refresh the equipment list
          toast({
            title: "Equipment Updated",
            description: "The equipment list has been updated",
          });
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleResize = useCallback(() => {
    // This empty callback is enough to trigger the debounced resize handling
  }, []);

  const { observe, unobserve } = useDebounceResize(handleResize);

  const handleAddEquipment = async (newEquipment: Equipment) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .insert([{
          id: newEquipment.id,
          Code: newEquipment.code,
          Name: newEquipment.name,
          Price: parseFloat(newEquipment.price),
          "Book Value": parseFloat(newEquipment.value),
          Weight: parseFloat(newEquipment.weight),
          Stock: newEquipment.stock,
          Folder: newEquipment.folderId,
        }]);

      if (error) throw error;

      toast({
        title: "Equipment added",
        description: "New equipment has been added successfully",
      });
    } catch (error) {
      console.error('Error adding equipment:', error);
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive",
      });
    }
  };

  const handleEditEquipment = async (editedEquipment: Equipment) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          Code: editedEquipment.code,
          Name: editedEquipment.name,
          Price: parseFloat(editedEquipment.price),
          "Book Value": parseFloat(editedEquipment.value),
          Weight: parseFloat(editedEquipment.weight),
          Stock: editedEquipment.stock,
          Folder: editedEquipment.folderId,
        })
        .eq('id', editedEquipment.id);

      if (error) throw error;

      setSelectedItems([]);
      toast({
        title: "Equipment updated",
        description: "Equipment has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Error",
        description: "Failed to update equipment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEquipment = async () => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;

      setSelectedItems([]);
      toast({
        title: "Equipment deleted",
        description: `${selectedItems.length} equipment item(s) have been removed`,
      });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Error",
        description: "Failed to delete equipment",
        variant: "destructive",
      });
    }
  };

  const handleItemSelect = (id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredEquipment.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredEquipment.map(item => item.id));
    }
  };

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
    setSelectedItems([]);
  };

  const daysToShow = 14;

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = !selectedFolder || selectedFolder === "all" || isItemInFolder(item.folderId, selectedFolder);
    return matchesSearch && matchesFolder;
  });

  const selectedEquipment = equipment
    .filter(item => selectedItems.includes(item.id))
    .map(item => ({
      id: item.id,
      name: item.name
    }));

  if (isLoading) {
    return <div className="flex justify-center items-center h-[400px]">Loading equipment...</div>;
  }

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 flex-1">
          <EquipmentFolderSelect
            selectedFolder={selectedFolder}
            onFolderSelect={handleFolderSelect}
          />
        </div>
        <AddEquipmentDialog onAddEquipment={handleAddEquipment} />
      </div>

      <div className="bg-zinc-900 rounded-md">
        <EquipmentSelectionHeader
          selectedItems={selectedItems}
          equipment={equipment}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEditEquipment={handleEditEquipment}
          onDeleteEquipment={handleDeleteEquipment}
        />

        <EquipmentTable
          equipment={filteredEquipment}
          selectedItems={selectedItems}
          onSelectAll={handleSelectAll}
          onItemSelect={handleItemSelect}
        />

        <EquipmentTimeline
          startDate={startDate}
          daysToShow={daysToShow}
          selectedEquipment={selectedEquipment}
          onPreviousPeriod={handlePreviousPeriod}
          onNextPeriod={handleNextPeriod}
          onMount={observe}
          onUnmount={unobserve}
        />
      </div>
    </div>
  );
}
