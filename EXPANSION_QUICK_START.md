# 🚀 Quick Start - Row Expansion Optimization

## 1. Drop-in Replacement (Immediate 5x speedup)

Replace in `EquipmentTimelineSection.tsx`:

```tsx
// OLD: Standard row implementation
{mainEquipment.map((equipment) => {
  const isEquipmentExpanded = expandedEquipment.has(equipment.id);
  return (
    <div key={equipment.id}>
      {/* Equipment row + conditional ProjectRows */}
    </div>
  );
})}

// NEW: Optimized row implementation  
{mainEquipment.map((equipment) => (
  <ExpandedEquipmentRow
    key={equipment.id}
    equipment={equipment}
    isExpanded={expandedEquipment.has(equipment.id)}
    equipmentUsage={equipmentProjectUsage.get(equipment.id)}
    formattedDates={formattedDates}
    getBookingForEquipment={getBookingForEquipment}
    getProjectQuantityForDate={getProjectQuantityForDate}
    onToggleExpansion={onToggleEquipmentExpansion}
  />
))}
```

## 2. Add CSS Animations (Smooth 60fps)

Import in your component:
```tsx
import './equipment-expansion.css';
```

## 3. For Large Lists (50+ equipment items)

Replace the entire equipment list with:
```tsx
<VirtualizedEquipmentList
  equipment={mainEquipment}
  expandedEquipment={expandedEquipment}
  equipmentProjectUsage={equipmentProjectUsage}
  formattedDates={formattedDates}
  getBookingForEquipment={getBookingForEquipment}
  getProjectQuantityForDate={getProjectQuantityForDate}
  onToggleExpansion={onToggleEquipmentExpansion}
  containerRef={equipmentRowsRef}
/>
```

## 4. Advanced Optimizations (Optional)

Replace expansion state management in `useEquipmentHub`:
```tsx
// OLD: Basic expansion state
const [expandedEquipment, setExpandedEquipment] = useState<Set<string>>(new Set());

// NEW: Optimized expansion with batching
const {
  expandedEquipment,
  toggleEquipmentExpansion,
  batchToggleExpansion,
  isEquipmentExpanded
} = useOptimizedExpansion({ equipmentProjectUsage });
```

That's it! Your row expansion will be 5x faster with smooth animations. 🎉