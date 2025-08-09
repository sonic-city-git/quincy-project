/**
 * 🎯 SUBRENTAL CONFIRMATION DIALOG
 * 
 * Dialog for confirming subrental details including:
 * - Period adjustment
 * - Provider selection  
 * - Additional equipment quantities
 * - Cost and notes
 */

import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { Calendar, Building2, Package, CreditCard, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { SubrentalSuggestion, ExternalProvider } from '@/types/equipment';
import { useSubrentalManagement } from '@/hooks/equipment/useSubrentalManagement';
import { toast } from 'sonner';

interface SubrentalConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: SubrentalSuggestion | null;
  conflictDate: string;
}

export function SubrentalConfirmationDialog({
  open,
  onOpenChange,
  suggestion,
  conflictDate
}: SubrentalConfirmationDialogProps) {
  // Form state
  const [selectedProvider, setSelectedProvider] = useState<ExternalProvider | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subrentalMutation = useSubrentalManagement();

  // Initialize form when suggestion changes
  useEffect(() => {
    if (suggestion && conflictDate) {
      // Set default provider (first in list)
      const defaultProvider = suggestion.suggestedProviders[0] || null;
      setSelectedProvider(defaultProvider);
      
      // Set default period (conflict date ± 1 day for buffer)
      const conflictDateObj = new Date(conflictDate);
      setStartDate(format(subDays(conflictDateObj, 1), 'yyyy-MM-dd'));
      setEndDate(format(addDays(conflictDateObj, 1), 'yyyy-MM-dd'));
      
      // Set default quantity to minimum needed
      setQuantity(suggestion.overbooked);
      
      // Reset other fields
      setCost(null);
      setNotes('');
    }
  }, [suggestion, conflictDate]);

  const handleSubmit = async () => {
    if (!suggestion || !selectedProvider || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // For each affected event, create a subrental record
      for (const event of suggestion.affectedEvents) {
        await subrentalMutation.mutateAsync({
          eventId: event.eventName, // This should be eventId, not eventName
          equipmentId: suggestion.equipmentId,
          providerId: selectedProvider.id,
          cost: cost || null,
          notes: notes.trim() || null
        });
      }
      
      toast.success(`Subrental confirmed with ${selectedProvider.company_name}`);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Failed to confirm subrental:', error);
      toast.error('Failed to confirm subrental');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!suggestion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Confirm Subrental: {suggestion.equipmentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Conflict Summary */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-100 text-red-700 text-sm px-2 py-1 rounded">
                  Overbooked by {suggestion.overbooked}
                </div>
                <span className="text-sm text-red-700">on {format(new Date(conflictDate), 'MMM dd, yyyy')}</span>
              </div>
              <div className="text-sm text-red-600">
                Affects {suggestion.affectedEvents.length} event{suggestion.affectedEvents.length > 1 ? 's' : ''}:
                {suggestion.affectedEvents.map((event, index) => (
                  <span key={index}>
                    {index > 0 && ', '}
                    <strong>{event.projectName}</strong> ({event.eventName})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Provider Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              External Provider
            </Label>
            <Select
              value={selectedProvider?.id || ''}
              onValueChange={(value) => {
                const provider = suggestion.suggestedProviders.find(p => p.id === value);
                setSelectedProvider(provider || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {suggestion.suggestedProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{provider.company_name}</span>
                      <div className="flex items-center gap-2 ml-4">
                        {provider.preferred_status && (
                          <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">
                            Preferred
                          </span>
                        )}
                        {provider.reliability_rating && (
                          <span className="text-xs text-gray-600">
                            ★{provider.reliability_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedProvider && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                <div className="grid grid-cols-2 gap-4">
                  {selectedProvider.contact_email && (
                    <div>
                      <strong>Email:</strong> {selectedProvider.contact_email}
                    </div>
                  )}
                  {selectedProvider.phone && (
                    <div>
                      <strong>Phone:</strong> {selectedProvider.phone}
                    </div>
                  )}
                  {selectedProvider.geographic_coverage && (
                    <div className="col-span-2">
                      <strong>Coverage:</strong> {selectedProvider.geographic_coverage.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          {/* Quantity and Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity Needed</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-gray-500">
                Minimum required: {suggestion.overbooked}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Estimated Cost (optional)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={cost || ''}
                onChange={(e) => setCost(parseFloat(e.target.value) || null)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes (optional)
            </Label>
            <Textarea
              placeholder="Special requirements, delivery instructions, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedProvider || !startDate || !endDate || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Subrental
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
