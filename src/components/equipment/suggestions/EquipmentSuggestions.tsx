import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types/equipment";
import { toast } from "sonner";

interface EquipmentSuggestionsProps {
  equipment: Equipment;
}

export function EquipmentSuggestions({ equipment }: EquipmentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getSuggestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-equipment', {
        body: { equipment }
      });

      if (error) throw error;
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast.error('Failed to get equipment suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={getSuggestions}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lightbulb className="mr-2 h-4 w-4" />
        )}
        {loading ? 'Getting Suggestions...' : 'Suggest Alternatives'}
      </Button>

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