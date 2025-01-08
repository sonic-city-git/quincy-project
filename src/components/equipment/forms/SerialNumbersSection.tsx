import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit, Trash2 } from "lucide-react";
import { AddSerialNumberDialog } from "../dialogs/AddSerialNumberDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SerialNumber } from "@/types/equipment";

interface SerialNumbersSectionProps {
  serialNumbers: SerialNumber[];
  onSerialNumberChange: (index: number, field: keyof SerialNumber, value: string) => void;
  onAddSerialNumber: () => void;
  onRemoveSerialNumber: (index: number) => void;
}

export function SerialNumbersSection({
  serialNumbers,
  onSerialNumberChange,
  onAddSerialNumber,
  onRemoveSerialNumber,
}: SerialNumbersSectionProps) {
  return (
    <div className="grid gap-2">
      <Label>Serial Numbers</Label>
      <ScrollArea className="h-[200px] border rounded-lg p-2">
        {serialNumbers.map((sn, index) => (
          <div key={index} className="flex items-center justify-between py-1 border-b last:border-0">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium leading-none">{sn.number}</p>
              {sn.notes && (
                <p className="text-xs text-muted-foreground leading-none">{sn.notes}</p>
              )}
            </div>
            {sn.number && (
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7"
                        onClick={() => {
                          // Edit functionality will be implemented here
                          console.log('Edit serial number:', sn.number);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit serial number</p>
                    </Toolt

ipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7"
                        onClick={() => onRemoveSerialNumber(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete serial number</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        ))}
        {serialNumbers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No serial numbers added yet
          </p>
        )}
      </ScrollArea>
      
      <AddSerialNumberDialog onAddSerialNumber={(number: string, notes: string) => {
        const newIndex = serialNumbers.length;
        onSerialNumberChange(newIndex, "number", number);
        if (notes) onSerialNumberChange(newIndex, "notes", notes);
        onAddSerialNumber();
      }} />

      <p className="text-sm text-muted-foreground">
        Stock: {serialNumbers.filter(sn => sn.number.trim() !== "").length} items
      </p>
    </div>
  );
}