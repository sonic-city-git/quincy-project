# 🎨 EQUIPMENT CARD DESIGN SYSTEM

## 🎯 **STANDARDIZED EQUIPMENT CARD PATTERNS**

### **📋 OVERVIEW**
This document defines the standardized design patterns for all equipment cards across the QUINCY variant system. These patterns ensure visual consistency, proper interaction states, and excellent user experience.

## 🏗️ **CARD ARCHITECTURE**

### **1. Stock Equipment Cards (EquipmentSelector)**
```tsx
// 🔹 PURPOSE: Display available stock equipment for adding to variants
// 🔹 CONTEXT: Left sidebar panel for equipment selection
// 🔹 INTERACTIONS: Drag to variant, double-click to add

<Card className={cn(
  COMPONENT_CLASSES.card.hover,
  "cursor-move group transition-all duration-200",
  "border-l-4 border-l-transparent hover:border-l-primary",
  "p-3"
)}>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {/* Visual indicator dot */}
      <div className="w-2 h-2 rounded-full bg-muted-foreground/40 group-hover:bg-primary/60" />
      
      {/* Equipment name */}
      <h3 className="text-sm font-medium text-foreground group-hover:text-primary">
        {item.name}
      </h3>
      
      {/* Equipment code badge */}
      {item.code && (
        <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
          {item.code}
        </span>
      )}
    </div>
    
    {/* Price display */}
    {item.rental_price && (
      <div className="text-xs text-muted-foreground font-medium">
        {formatPrice(item.rental_price)}
      </div>
    )}
  </div>
</Card>
```

### **2. Variant Equipment Cards (ProjectEquipmentItem)**
```tsx
// 🔹 PURPOSE: Display equipment assigned to variant with quantity controls
// 🔹 CONTEXT: Inside equipment groups within variant content
// 🔹 INTERACTIONS: Edit quantity, drag to reorder, remove from variant

<Card className={cn(
  COMPONENT_CLASSES.card.hover,
  "relative group transition-all duration-200",
  "border-l-4 border-l-accent hover:border-l-primary",
  "p-3",
  isRemoving && "opacity-50 pointer-events-none animate-pulse",
  isUpdating && "ring-2 ring-primary/20"
)}>
  <div className="flex items-center justify-between h-full">
    {/* Equipment info with quantity control */}
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {/* Quantity input with visual indicator */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={item.quantity}
          className="w-14 h-7 text-center text-xs font-semibold border-2"
        />
        <span className="text-xs text-muted-foreground">×</span>
      </div>
      
      {/* Equipment details */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground group-hover:text-primary">
          {item.name}
        </h3>
        {item.code && (
          <span className="text-xs text-muted-foreground font-mono">
            {item.code}
          </span>
        )}
      </div>
    </div>

    {/* Price and actions */}
    <div className="flex items-center gap-3 flex-shrink-0">
      {/* Total and unit price */}
      <div className="text-right">
        <div className="text-sm font-semibold">{formattedPrice}</div>
        {item.quantity > 1 && (
          <div className="text-xs text-muted-foreground">
            {formatPrice(item.rental_price)} each
          </div>
        )}
      </div>
      
      {/* Remove button (appears on hover) */}
      <Button className="opacity-0 group-hover:opacity-100">
        <X className="h-4 w-4" />
      </Button>
    </div>
  </div>
</Card>
```

## 🎨 **DESIGN PATTERNS**

### **Visual Hierarchy**
1. **Primary Info**: Equipment name (font-medium, text-foreground)
2. **Secondary Info**: Equipment code (text-xs, font-mono, muted)
3. **Tertiary Info**: Prices (font-semibold for totals, muted for units)
4. **Interactive Elements**: Quantity inputs, action buttons

### **Color System**
```scss
// Border indicators
border-l-transparent          // Default state
border-l-primary             // Hover/active state  
border-l-accent              // Assigned equipment

// Interactive states
bg-primary/5                 // Focus backgrounds
ring-primary/20              // Loading/updating states
text-primary                 // Hover text color
text-destructive             // Remove actions
```

### **Spacing Standards**
```scss
// Card padding
p-3                          // Standard card padding

// Internal spacing  
gap-3                        // Main element spacing
gap-2                        // Secondary element spacing
space-y-1.5                  // Compact item spacing
space-y-2                    // Standard item spacing
```

## 🔄 **INTERACTION STATES**

### **1. Hover States**
- **Border**: Transparent → Primary color
- **Text**: Foreground → Primary color  
- **Indicator**: Muted → Primary color
- **Transition**: 200ms duration for smooth feedback

### **2. Focus States**
- **Outline**: Clear focus indicators
- **Background**: Subtle primary background
- **Accessibility**: Proper ARIA labels and roles

### **3. Drag States**
- **Cursor**: `cursor-move` for draggable items
- **Feedback**: Visual indicators during drag operations
- **Drop zones**: Clear visual feedback for valid drop targets

### **4. Loading States**
- **Input borders**: Primary color during updates
- **Ring indicators**: `ring-2 ring-primary/20`
- **Disabled states**: Opacity reduction and pointer-events-none

### **5. Error/Removal States**
- **Animation**: Pulse animation for removal
- **Color**: Destructive colors for removal actions
- **Opacity**: 50% for items being removed

## 📱 **RESPONSIVE BEHAVIOR**

### **Compact Mode**
```tsx
// Triggered by compact={true} prop
className={cn(
  compact ? "p-2 text-xs" : "p-3 text-sm",  // Reduced padding and text
  compact ? "h-6 w-6" : "h-7 w-7"           // Smaller buttons
)}
```

### **Mobile Adaptations**
- Touch-friendly button sizes (minimum 44px)
- Larger quantity inputs for finger interaction
- Simplified hover states (focus-based instead)

## ♿ **ACCESSIBILITY**

### **ARIA Labels**
```tsx
aria-label={`Add ${item.name} to variant. Double-click or drag to add.`}
aria-label={`${item.name} - Quantity: ${item.quantity}, Total: ${formattedPrice}`}
aria-label={`Remove ${item.name} from project`}
```

### **Keyboard Navigation**
- **Tab order**: Logical progression through interactive elements
- **Focus indicators**: Clear visual focus states
- **Action triggers**: Enter/Space for button activation

### **Screen Reader Support**
- **Role attributes**: `role="button"`, `role="listitem"`
- **State announcements**: Loading, updating, error states
- **Context information**: Group membership, totals, quantities

## 🚀 **PERFORMANCE OPTIMIZATIONS**

### **Memoization**
```tsx
// Price calculations
const formattedPrice = useMemo(() => {
  return item.rental_price ? formatPrice(item.rental_price * item.quantity) : '-';
}, [item.rental_price, item.quantity]);
```

### **Animations**
- **Duration**: 200ms for smooth feel without lag
- **Transitions**: Only on necessary properties (color, transform)
- **Hardware acceleration**: `transform` properties for smooth animations

### **Rendering**
- **Conditional rendering**: Hide/show elements based on state
- **Lazy evaluation**: Compute expensive operations only when needed

## 📊 **COMPONENT VARIATIONS**

| Component | Purpose | Key Features | Compact Mode |
|-----------|---------|--------------|--------------|
| **Stock Cards** | Equipment selection | Drag/drop, pricing display | ❌ Not applicable |
| **Variant Cards** | Assigned equipment | Quantity control, removal | ✅ Reduced padding/text |
| **Group Headers** | Group organization | Selection, deletion, totals | ✅ Smaller icons/text |

## 🔧 **IMPLEMENTATION CHECKLIST**

### **Required Imports**
```tsx
import { COMPONENT_CLASSES, cn } from '@/design-system';
import { formatPrice } from '@/utils/priceFormatters';
```

### **Design System Compliance**
- ✅ Use `COMPONENT_CLASSES.card.hover` for consistent hover states
- ✅ Apply `cn()` utility for className composition
- ✅ Follow `FORM_PATTERNS` for input styling
- ✅ Use design system color tokens (STATUS_COLORS)

### **Code Quality Standards**
- ✅ TypeScript interfaces for all props
- ✅ Proper error handling and loading states
- ✅ Memoization for expensive computations
- ✅ Accessibility attributes (ARIA, roles)
- ✅ Performance-optimized animations

## 🎯 **BENEFITS ACHIEVED**

### **User Experience**
- **Consistent**: Unified visual language across all equipment cards
- **Intuitive**: Clear visual hierarchy and interaction patterns
- **Responsive**: Adapts beautifully to different screen sizes
- **Accessible**: Works with screen readers and keyboard navigation

### **Developer Experience**
- **Maintainable**: Standardized patterns reduce complexity
- **Reusable**: Components work across different contexts
- **Performant**: Optimized for smooth interactions
- **Type-safe**: Full TypeScript support with proper interfaces

### **Design System Integration**
- **Compliant**: Follows established design system patterns
- **Extensible**: Easy to add new card variations
- **Consistent**: Unified approach to spacing, colors, and typography
- **Future-proof**: Built with scalability in mind

This design system ensures that all equipment cards provide excellent user experience while maintaining code quality and design consistency throughout the QUINCY application.