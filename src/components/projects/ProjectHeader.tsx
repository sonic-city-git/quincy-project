import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ProjectHeaderProps {
  name: string;
  lastInvoiced: string;
  color: string;
}

export const ProjectHeader = ({ name, lastInvoiced, color }: ProjectHeaderProps) => {
  return (
    <div className="w-full bg-secondary/20 px-6 py-6 mb-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className={`${color} p-4 rounded-lg`}>
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