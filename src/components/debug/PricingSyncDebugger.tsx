/**
 * 🧪 PRICING SYNC DEBUGGER COMPONENT
 * 
 * Temporary component for debugging pricing synchronization issues.
 * This will help us identify where the sync chain is breaking.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { testPricingSyncFlow } from '@/utils/testPricingSync';
import { useProjectVariants } from '@/hooks/useProjectVariants';

interface PricingSyncDebuggerProps {
  projectId: string;
}

export function PricingSyncDebugger({ projectId }: PricingSyncDebuggerProps) {
  const { variants, selectedVariantObject } = useProjectVariants(projectId);

  const runTest = async () => {
    if (!selectedVariantObject?.id) {
      console.error('❌ No variant selected');
      return;
    }

    console.log('🧪 Running pricing sync test...');
    try {
      await testPricingSyncFlow({
        projectId,
        variantId: selectedVariantObject.id
      });
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };

  return (
    <Card className="p-4 m-4 border-2 border-orange-500">
      <h3 className="text-lg font-bold mb-2">🧪 Pricing Sync Debugger</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Debug tool to test pricing synchronization flow.
        Check browser console for detailed logs.
      </p>
      
      <div className="space-y-2">
        <p><strong>Project ID:</strong> {projectId}</p>
        <p><strong>Selected Variant:</strong> {selectedVariantObject?.variant_name || 'None'}</p>
        <p><strong>Variant ID:</strong> {selectedVariantObject?.id || 'None'}</p>
        <p><strong>Total Variants:</strong> {variants.length}</p>
      </div>

      <Button 
        onClick={runTest} 
        disabled={!selectedVariantObject?.id}
        className="mt-4"
      >
        🧪 Test Pricing Sync Flow
      </Button>
      
      <p className="text-xs text-muted-foreground mt-2">
        This component will be removed after debugging.
      </p>
    </Card>
  );
}
