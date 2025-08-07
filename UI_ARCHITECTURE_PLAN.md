# 🎨 UI ARCHITECTURE PLAN

## **📋 TRANSFORMATION OVERVIEW**

**Objective**: Create a unified Resources tab that elegantly handles project variants while preserving existing functionality and design system standards.

**Strategy**: Build new components in parallel, then gradually integrate without breaking existing workflows.

---

## **🔍 CURRENT UI ANALYSIS**

### **Existing Project Detail Structure**
```
src/components/projects/detail/
├─ ProjectTabs.tsx                    // Tab container
├─ ProjectDetailTabsHeader.tsx        // Tab navigation  
├─ equipment/
│  ├─ ProjectEquipmentTab.tsx         // Equipment management
│  ├─ ProjectBaseEquipmentList.tsx    // Equipment list with groups
│  ├─ EquipmentSelector.tsx           // Available equipment picker
│  └─ GroupSelector.tsx               // Equipment group management
├─ crew/
│  ├─ ProjectCrewTab.tsx              // Crew management
│  ├─ ProjectRoleList.tsx             // Role list and assignments
│  └─ AddRoleDialog.tsx               // Add new roles
└─ ProjectGeneralTab.tsx              // Project info and calendar
```

### **Key Systems to Preserve**
✅ **Equipment Groups**: Complex drag-drop system with groups  
✅ **Sync Infrastructure**: Bidirectional sync between templates and events  
✅ **Design System**: Recently standardized components and patterns  
✅ **Real-time Updates**: Supabase subscriptions and optimistic updates  

---

## **🏗️ NEW COMPONENT ARCHITECTURE**

### **Target Structure**
```
src/components/projects/detail/
├─ ProjectTabs.tsx                    // Updated with Resources tab
├─ ProjectDetailTabsHeader.tsx        // Updated tab navigation
├─ resources/                         // NEW: Unified resources management
│  ├─ ResourcesTab.tsx                // Main resources container
│  ├─ VariantSelector.tsx             // Variant selection UI
│  ├─ VariantsContent.tsx             // Optimized content with left/right layout
│  ├─ sections/
│  │  ├─ CrewVariantSection.tsx       // Crew management for variant
│  │  └─ EquipmentVariantSection.tsx  // Equipment management for variant
│  ├─ hooks/
│  │  ├─ useProjectVariants.ts        // Variant CRUD operations
│  │  ├─ useVariantEquipment.ts       // Equipment & group management
│  │  ├─ useVariantCrew.ts            // Crew role management
│  │  ├─ useVariantData.ts            // Unified data access
│  │  └─ useVariantSync.ts            // Sync operations for variants
│  └─ dialogs/
│     ├─ AddVariantDialog.tsx         // Create new variants
│     ├─ EditVariantDialog.tsx        // Edit variant details
│     └─ DeleteVariantDialog.tsx      // Delete variant confirmation
├─ equipment/                         // EXISTING: Kept for non-artist projects
├─ crew/                              // EXISTING: Kept for non-artist projects  
└─ ProjectGeneralTab.tsx              // EXISTING: Unchanged
```

---

## **🎯 COMPONENT SPECIFICATIONS**

### **ResourcesTab.tsx**
```typescript
interface ResourcesTabProps {
  projectId: string;
  project: Project;
}

// Main container for unified resources management
export function ResourcesTab({ projectId, project }: ResourcesTabProps) {
  const { variants, selectedVariant, setSelectedVariant } = useProjectVariants(projectId);
  const { isArtistProject } = useProjectType(project);
  
  // Only show variant system for artist projects
  if (!isArtistProject) {
    return <LegacyResourcesTabs projectId={projectId} />;
  }
  
  return (
    <div className="space-y-6">
      <VariantSelector
        variants={variants}
        selectedVariant={selectedVariant}
        onVariantChange={setSelectedVariant}
        projectId={projectId}
      />
      
      <VariantsContent
        projectId={projectId}
        variantName={selectedVariant}
      />
    </div>
  );
}
```

### **VariantSelector.tsx**
```typescript
interface VariantSelectorProps {
  variants: ProjectVariant[];
  selectedVariant: string;
  onVariantChange: (variant: string) => void;
  projectId: string;
}

// Elegant variant selection with add/edit capabilities
export function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
  projectId
}: VariantSelectorProps) {
  const { showAddDialog, setShowAddDialog } = useDialogState();
  
  return (
    <div className={COMPONENT_CLASSES.card.default}>
      <div className={RESPONSIVE.flex.header}>
        <h3 className={FORM_PATTERNS.typography.sectionHeader}>
          Performance Variants
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Variant Tabs */}
          {variants.map((variant) => (
            <Button
              key={variant.variant_name}
              variant={selectedVariant === variant.variant_name ? "default" : "outline"}
              size="sm"
              onClick={() => onVariantChange(variant.variant_name)}
              className="min-w-[80px]"
            >
              {variant.display_name}
            </Button>
          ))}
          
          {/* Add Variant Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="text-muted-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Variant
          </Button>
        </div>
      </div>
      
      <AddVariantDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        projectId={projectId}
      />
    </div>
  );
}
```

### **VariantsContent.tsx** (Optimized Layout)
```typescript
interface VariantsContentProps {
  projectId: string;
  variantName: string;
}

// Main content area for variant resources
export function VariantsContent({
  projectId,
  variantName
}: VariantsContentProps) {
  const { equipmentData, crewRoles, isLoading } = useVariantData(projectId, variantName);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className={RESPONSIVE.grid.twoColumn}>
      <CrewVariantSection
        projectId={projectId}
        variantName={variantName}
        crewData={crewData}
      />
      
      <EquipmentVariantSection
        projectId={projectId}
        variantName={variantName}
        equipmentData={equipmentData}
      />
    </div>
  );
}
```

### **CrewVariantSection.tsx**
```typescript
interface CrewVariantSectionProps {
  projectId: string;
  variantName: string;
  crewData: VariantCrewData;
}

// Crew management within Resources tab
export function CrewVariantSection({
  projectId,
  variantName,
  crewData
}: CrewVariantSectionProps) {
  const { addRole, removeRole, updateRole } = useVariantCrewManagement(projectId, variantName);
  
  return (
    <StandardizedCard title="Crew Requirements" icon={Users}>
      <div className="space-y-4">
        {crewData.roles.map((role) => (
          <CrewRoleItem
            key={role.id}
            role={role}
            onUpdate={updateRole}
            onRemove={removeRole}
            variantName={variantName}
          />
        ))}
        
        <Button
          variant="outline"
          onClick={() => setShowAddRoleDialog(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Crew Role
        </Button>
      </div>
    </StandardizedCard>
  );
}
```

---

## **🔗 HOOK ARCHITECTURE**

### **useProjectVariants.ts**
```typescript
export function useProjectVariants(projectId: string) {
  // Variant CRUD operations
  const { data: variants, isLoading } = useQuery({
    queryKey: ['project-variants', projectId],
    queryFn: () => fetchProjectVariants(projectId)
  });
  
  const [selectedVariant, setSelectedVariant] = useState<string>('default');
  
  const createVariant = useMutation({
    mutationFn: (data: CreateVariantData) => createProjectVariant(projectId, data),
    onSuccess: () => queryClient.invalidateQueries(['project-variants', projectId])
  });
  
  const updateVariant = useMutation({
    mutationFn: (data: UpdateVariantData) => updateProjectVariant(data),
    onSuccess: () => queryClient.invalidateQueries(['project-variants', projectId])
  });
  
  const deleteVariant = useMutation({
    mutationFn: (variantName: string) => deleteProjectVariant(projectId, variantName),
    onSuccess: () => {
      queryClient.invalidateQueries(['project-variants', projectId]);
      // Switch to default if deleted variant was selected
      if (selectedVariant === variantName) {
        setSelectedVariant('default');
      }
    }
  });
  
  return {
    variants: variants || [],
    isLoading,
    selectedVariant,
    setSelectedVariant,
    createVariant,
    updateVariant,
    deleteVariant
  };
}
```

### **useVariantData.ts** (Optimized Architecture)
```typescript
export function useVariantData(projectId: string, variantName: string) {
  // Consolidated data fetching for variant resources
  const { data, isLoading } = useQuery({
    queryKey: ['variant-resources', projectId, variantName],
    queryFn: async () => {
      const [crewRoles, equipment, groups] = await Promise.all([
        fetchVariantCrewRoles(projectId, variantName),
        fetchVariantEquipment(projectId, variantName),
        fetchVariantEquipmentGroups(projectId, variantName)
      ]);
      
      return {
        crewData: processCrewData(crewRoles),
        equipmentData: processEquipmentData(equipment, groups)
      };
    },
    enabled: !!projectId && !!variantName
  });
  
  return {
    crewData: data?.crewData || { roles: [] },
    equipmentData: data?.equipmentData || { groups: [], ungrouped: [] },
    isLoading
  };
}
```

---

## **🎨 DESIGN SYSTEM INTEGRATION**

### **Visual Hierarchy**
```typescript
// Variant selector uses button group pattern
const VARIANT_BUTTON_CLASSES = {
  active: cn(
    COMPONENT_CLASSES.button.primary,
    "shadow-sm ring-1 ring-primary/20"
  ),
  inactive: cn(
    COMPONENT_CLASSES.button.outline,
    "text-muted-foreground hover:text-foreground"
  )
};

// Resource sections use standardized card pattern  
const RESOURCE_SECTION_CLASSES = {
  container: cn(
    COMPONENT_CLASSES.card.default,
    RESPONSIVE.spacing.section
  ),
  header: cn(
    FORM_PATTERNS.typography.sectionHeader,
    RESPONSIVE.flex.spaceBetween
  )
};
```

### **Responsive Behavior**
```typescript
// Mobile-first responsive layout
const RESOURCES_LAYOUT = {
  desktop: "grid grid-cols-2 gap-6",
  tablet: "grid grid-cols-1 gap-4", 
  mobile: "space-y-4"
};

// Variant selector adapts to screen size
const VARIANT_SELECTOR_LAYOUT = {
  desktop: "flex items-center gap-2",
  mobile: "grid grid-cols-2 gap-2"
};
```

---

## **♿ ACCESSIBILITY IMPLEMENTATION**

### **ARIA Labels and Roles**
```typescript
// Variant selector accessibility
<div role="tablist" aria-label="Performance variants">
  {variants.map((variant) => (
    <button
      key={variant.variant_name}
      role="tab"
      aria-selected={selectedVariant === variant.variant_name}
      aria-controls={`variant-content-${variant.variant_name}`}
      id={`variant-tab-${variant.variant_name}`}
    >
      {variant.display_name}
    </button>
  ))}
</div>

// Content area accessibility
<div
  role="tabpanel"
  aria-labelledby={`variant-tab-${selectedVariant}`}
  id={`variant-content-${selectedVariant}`}
>
  <VariantsContent {...props} />
</div>
```

### **Keyboard Navigation**
- **Tab Order**: Logical progression through variant selector → crew section → equipment section
- **Arrow Keys**: Navigate between variant tabs
- **Enter/Space**: Activate variant selection
- **Escape**: Close dialogs and dropdowns

---

## **⚡ PERFORMANCE OPTIMIZATIONS**

### **Memoization Strategy**
```typescript
// Memoize expensive calculations
const processedCrewData = useMemo(
  () => processCrewRoles(crewRoles, variantName),
  [crewRoles, variantName]
);

// Memoize component renders
const MemoizedCrewSection = memo(CrewVariantSection, (prev, next) => 
  prev.variantName === next.variantName &&
  prev.crewData === next.crewData
);
```

### **Lazy Loading**
```typescript
// Lazy load variant content
const VariantsContent = lazy(() =>
import('./VariantsContent').then(m => ({ default: m.VariantsContent }))
);

// Suspense with loading fallback
<Suspense fallback={<ResourcesLoadingSkeleton />}>
  <VariantsContent {...props} />
</Suspense>
```

### **Optimistic Updates**
```typescript
// Immediate UI feedback for variant switching
const handleVariantChange = useCallback((newVariant: string) => {
  // Immediate UI update
  setSelectedVariant(newVariant);
  
  // Background data prefetch
  queryClient.prefetchQuery(['variant-resources', projectId, newVariant]);
}, [projectId, queryClient]);
```

---

## **🧪 TESTING STRATEGY**

### **Component Testing**
```typescript
describe('ResourcesTab', () => {
  test('renders variant selector for artist projects');
  test('falls back to legacy tabs for non-artist projects');
  test('handles variant switching correctly');
  test('preserves variant selection on page refresh');
});

describe('VariantSelector', () => {
  test('displays all available variants');
  test('highlights selected variant');
  test('opens add variant dialog');
  test('handles variant creation and deletion');
});
```

### **Integration Testing**
```typescript
describe('Variant Resource Management', () => {
  test('creates crew roles for specific variant');
  test('manages equipment groups per variant');
  test('syncs variant changes to events');
  test('handles concurrent variant modifications');
});
```

---

## **🔄 MIGRATION PATHWAY**

### **Phase 1: Parallel Development**
- Build new Resources tab alongside existing tabs
- No changes to existing Equipment/Crew tabs
- Feature flag to enable Resources tab for testing

### **Phase 2: Gradual Integration**  
- Enable Resources tab for artist projects only
- Preserve Equipment/Crew tabs for other project types
- User preference for tab layout

### **Phase 3: Full Rollout**
- Resources tab becomes default for artist projects  
- Legacy tabs remain available as fallback
- Complete testing and optimization

---

**Next Steps**: Begin component development with ResourcesTab shell and VariantSelector implementation.