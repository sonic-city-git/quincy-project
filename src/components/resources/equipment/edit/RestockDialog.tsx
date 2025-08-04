import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface RestockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restockAmount: string;
  onRestockAmountChange: (value: string) => void;
  onRestock: () => Promise<void>;
  isRestocking: boolean;
}

export function RestockDialog({
  open,
  onOpenChange,
  restockAmount,
  onRestockAmountChange,
  onRestock,
  isRestocking
}: RestockDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restock Consumable</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the amount to add to the current stock.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Input
            type="number"
            placeholder="Enter amount to add"
            value={restockAmount}
            onChange={(e) => onRestockAmountChange(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onRestock}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isRestocking}
          >
            {isRestocking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Restock
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}