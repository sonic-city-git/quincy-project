import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ProjectHeaderProps {
  name: string;
  lastInvoiced: string;
  color: string;
}

const getTailwindColor = (colorClass: string) => {
  // Map Tailwind color classes to hex values
  const colorMap: { [key: string]: string } = {
    'bg-rose-800': '#9f1239',
    'bg-blue-800': '#1e40af',
    'bg-green-800': '#166534',
    'bg-purple-800': '#6b21a8',
    'bg-orange-800': '#9a3412',
    // Add more color mappings as needed
  };

  return colorMap[colorClass] || '#9f1239'; // Default to rose if color not found
};

export const ProjectHeader = ({ name, lastInvoiced, color }: ProjectHeaderProps) => {
  const backgroundColor = getTailwindColor(color);
  
  return (
    <div className="w-full bg-secondary/20 px-6 py-6 mb-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div 
            className="p-4 rounded-lg shadow-lg transition-all duration-200"
            style={{ 
              background: backgroundColor,
              boxShadow: `0 4px 6px -1px ${backgroundColor}40, 0 2px 4px -1px ${backgroundColor}60`
            }}
          >
            <h1 className="text-3xl font-bold text-white">{name}</h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last Invoiced</p>
              <p className="font-medium">{lastInvoiced}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Accumulated Cost</p>
              <p className="font-medium">{"0 kr"}</p>
            </div>
            <Button>
              <Send className="mr-2 h-4 w-4" /> Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};