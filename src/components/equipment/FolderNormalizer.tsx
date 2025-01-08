import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface NormalizationResult {
  total_folders: number;
  folders_updated: number;
  updated_folders: Array<{
    original: string;
    normalized: string;
  }>;
}

export function FolderNormalizer() {
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [result, setResult] = useState<NormalizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const normalizeFolders = async () => {
    try {
      setIsNormalizing(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('normalize-folder-names');
      
      if (error) {
        console.error('Error from Edge Function:', error);
        throw new Error('Failed to normalize folder names. Please try again.');
      }
      
      setResult(data as NormalizationResult);
      
      toast({
        title: "Folders normalized",
        description: `${data.folders_updated} folders were updated.`,
      });
    } catch (error) {
      console.error('Error normalizing folders:', error);
      setError(error.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: "Failed to normalize folder names",
        variant: "destructive",
      });
    } finally {
      setIsNormalizing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={normalizeFolders}
        disabled={isNormalizing}
      >
        {isNormalizing ? 'Normalizing...' : 'Normalize Folder Names'}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-2">
          <div className="text-sm">
            <p>Total folders: {result.total_folders}</p>
            <p>Folders updated: {result.folders_updated}</p>
          </div>

          {result.updated_folders.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Updated Folders:</h3>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <ul className="space-y-2">
                  {result.updated_folders.map((folder, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{folder.original}</span>
                      <span className="text-muted-foreground"> → {folder.normalized}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}