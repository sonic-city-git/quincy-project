import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FolderAnalysisResult {
  missingFolders: Array<{
    original: string;
    normalized: string;
  }>;
  totalEquipmentFolders: number;
  totalExistingFolders: number;
}

export function FolderAnalysis() {
  const [result, setResult] = useState<FolderAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeFolders = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('analyze-folders');
      
      if (error) throw error;
      
      console.log('Folder analysis result:', data);
      setResult(data as FolderAnalysisResult);
    } catch (error) {
      console.error('Error analyzing folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={analyzeFolders}
        disabled={isLoading}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Missing Folders'}
      </Button>

      {result && (
        <div className="space-y-2">
          <div className="text-sm">
            <p>Total folders in equipment: {result.totalEquipmentFolders}</p>
            <p>Total existing folders: {result.totalExistingFolders}</p>
          </div>

          {result.missingFolders.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-2">Missing Folders:</h3>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <ul className="space-y-2">
                  {result.missingFolders.map((folder, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{folder.original}</span>
                      {folder.normalized !== folder.original && (
                        <span className="text-muted-foreground"> (normalized: {folder.normalized})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No missing folders found!</p>
          )}
        </div>
      )}
    </div>
  );
}