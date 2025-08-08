# 🎯 SIMPLIFIED VARIANT SELECTOR APPROACH

## The Problem
Current VariantSelector is 150+ lines of complexity for what should be a simple dropdown.

## Simple Solution

### 1. Pre-load variants at parent level
```typescript
// In EventFormDialog - load variants BEFORE opening dialog
const { data: variants, isLoading } = useProjectVariants(projectId);

// Don't open dialog until variants are loaded
if (isLoading) return <LoadingSpinner />;
```

### 2. Simple dropdown with no "smart" behavior
```typescript
function SimpleVariantSelector({ variants, value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select variant" />
      </SelectTrigger>
      <SelectContent>
        {variants.map(variant => (
          <SelectItem key={variant.id} value={variant.variant_name}>
            {variant.variant_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### 3. Set intelligent defaults at form level
```typescript
// In form initialization - ONE place for logic
const defaultVariant = variants?.[0]?.variant_name || 'default';

const form = useForm({
  defaultValues: {
    variantName: defaultVariant // Set ONCE, no changes
  }
});
```

## Benefits
- ✅ No async loading in component
- ✅ No auto-selection logic
- ✅ No race conditions
- ✅ No flicker
- ✅ 20 lines instead of 150
- ✅ Just works like every other dropdown

## Implementation Steps
1. Move variant loading to parent components
2. Replace complex VariantSelector with simple one
3. Handle defaults at form level
4. Remove all "smart" behavior

Result: Normal dropdown that behaves normally.
