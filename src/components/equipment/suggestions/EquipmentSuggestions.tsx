import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Lightbulb, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types/equipment";
import { toast } from "sonner";

interface EquipmentSuggestionsProps {
  equipment: Equipment;
  onClose?: () => void;
}

export function EquipmentSuggestions({ equipment, onClose }: EquipmentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    setLoading(true);
    try {
      console.log('Sending equipment data:', equipment);
      
      const { data, error } = await supabase.functions.invoke('suggest-equipment', {
        body: { 
          equipment: {
            name: equipment.name,
            rental_price: equipment.rental_price,
            code: equipment.code
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.suggestions) {
        throw new Error('No suggestions received from the function');
      }

      setSuggestions(data.suggestions);
    } catch (error: any) {
      console.error('Error getting suggestions:', error);
      toast.error(error.message || 'Failed to get equipment suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={getSuggestions}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Getting Suggestions...' : 'Suggest Alternatives'}
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {suggestions && (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="whitespace-pre-line text-sm">
            {suggestions}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}