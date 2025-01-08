import { useState, useCallback, useRef, useEffect } from "react";
import { addDays, subDays } from "date-fns";
import { useDebounceResize } from "@/hooks/useDebounceResize";
import { EquipmentTimeline } from "./equipment/EquipmentTimeline";
import { EquipmentTable } from "./equipment/EquipmentTable";
import { EquipmentSelectionHeader } from "./equipment/EquipmentSelectionHeader";
import { EquipmentHeader } from "./equipment/EquipmentHeader";
import { useEquipmentData } from "@/hooks/useEquipmentData";
import { useEquipmentFilter } from "@/hooks/useEquipmentFilter";
import { useEquipmentSelection } from "@/hooks/useEquipmentSelection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function EquipmentList() {
  const [startDate, setStartDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const daysToShow = 14;
  const { toast } = useToast();

  const { 
    equipment, 
    isLoading, 
    handleAddEquipment, 
    handleEditEquipment, 
    handleDeleteEquipment,
    refetchEquipment 
  } = useEquipmentData();

  const {
    selectedFolder,
    setSelectedFolder,
    searchTerm,
    setSearchTerm,
    filterEquipment,
  } = useEquipmentFilter();

  const {
    selectedItems,
    handleItemSelect,
    handleSelectAll,
    clearSelection,
  } = useEquipmentSelection();

  const handleResize = useCallback(() => {
    // This empty callback is enough to trigger the debounced resize handling
  }, []);

  const { observe, unobserve } = useDebounceResize(handleResize);

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolder(folderId);
    clearSelection();
  };

  const handlePreviousPeriod = () => {
    setStartDate(prev => subDays(prev, daysToShow));
  };

  const handleNextPeriod = () => {
    setStartDate(prev => addDays(prev, daysToShow));
  };

  useEffect(() => {
    const migrateFolders = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('migrate-equipment-folders');
        
        if (error) throw error;

        toast({
          title: "Success",
          description: data.message,
        });

        // Refresh the equipment list to show updated folder IDs
        refetchEquipment();
      } catch (error) {
        console.error('Error migrating equipment folders:', error);
        toast({
          title: "Error",
          description: "Failed to migrate equipment folders",
          variant: "destructive",
        });
      }
    };

    migrateFolders();
  }, []); // Run once when component mounts

  const filteredEquipment = filterEquipment(equipment);

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
      <EquipmentHeader
        selectedFolder={selectedFolder}
        onFolderSelect={handleFolderSelect}
        onAddEquipment={handleAddEquipment}
      />

      <div className="bg-zinc-900 rounded-md">
        <EquipmentSelectionHeader
          selectedItems={selectedItems}
          equipment={equipment}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEditEquipment={handleEditEquipment}
          onDeleteEquipment={() => {
            handleDeleteEquipment(selectedItems);
            clearSelection();
          }}
        />

        <EquipmentTable
          equipment={filteredEquipment}
          selectedItems={selectedItems}
          onSelectAll={() => handleSelectAll(filteredEquipment)}
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