/**
 * CONSOLIDATED: useScrollToTarget - Eliminates scroll duplication across tables
 * 
 * Replaces identical 40+ line scroll logic in ResourceCrewTable and ResourceEquipmentTable
 * Provides unified target scrolling with highlighting for any resource type
 */

import { useState, useEffect } from 'react';

export interface TargetScrollItem {
  type: 'crew' | 'equipment';
  id: string;
}

/**
 * Reusable hook for scrolling to and highlighting target items in resource tables
 */
export function useScrollToTarget(
  targetScrollItem: TargetScrollItem | null,
  dataLoaded: boolean,
  resourceType: 'crew' | 'equipment'
) {
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!targetScrollItem || !targetScrollItem.id || !dataLoaded) {
      return;
    }

    // Only process if the target type matches our resource type
    if (targetScrollItem.type !== resourceType) {
      return;
    }

    const timer = setTimeout(() => {
      try {
        // Look for the target item in the DOM using data attribute
        const dataAttribute = `data-${resourceType}-id`;
        const targetElement = document.querySelector(`[${dataAttribute}="${targetScrollItem.id}"]`);
        
        if (targetElement) {
          // Highlight the item
          setHighlightedItem(targetScrollItem.id);
          
          // Scroll to the target element
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedItem(null);
          }, 3000);
        } else {
          console.warn(`Could not find ${resourceType} with ID: ${targetScrollItem.id}`);
        }
      } catch (error) {
        console.error(`Error scrolling to target ${resourceType}:`, error);
      }
    }, 500); // Wait for render
    
    return () => clearTimeout(timer);
  }, [targetScrollItem, dataLoaded, resourceType]);

  return {
    highlightedItem,
    // Helper function to check if an item should be highlighted
    isHighlighted: (itemId: string) => highlightedItem === itemId
  };
}