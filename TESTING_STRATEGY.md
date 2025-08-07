# 🧪 TESTING STRATEGY

## **📋 TESTING OVERVIEW**

**Objective**: Ensure robust, reliable, and performant delivery of the project variants system with zero regressions in existing functionality.

**Philosophy**: Test early, test often, test thoroughly. Every component and feature must be validated before moving to the next phase.

---

## **🔍 TESTING LEVELS**

### **1. Unit Testing**
**Scope**: Individual functions, hooks, and components  
**Tools**: Jest, React Testing Library, MSW for API mocking  
**Coverage Target**: 95%+ for new code

### **2. Integration Testing**  
**Scope**: Component interactions, hook combinations, database operations  
**Tools**: Jest, React Testing Library, Supabase test client  
**Coverage Target**: 90%+ for critical workflows

### **3. End-to-End Testing**
**Scope**: Complete user workflows, cross-browser testing  
**Tools**: Playwright, custom test utilities  
**Coverage Target**: 100% of happy paths, 80% of edge cases

### **4. Performance Testing**
**Scope**: Database queries, UI responsiveness, bundle size  
**Tools**: Lighthouse, Jest performance benchmarks, Bundle analyzer  
**Targets**: <200ms response times, <5% bundle increase

---

## **📊 TEST MATRIX BY PHASE**

## **🎯 PHASE 1: DATABASE & HOOKS TESTING**

### **Database Migration Testing**
```sql
-- Test Schema: migration_test_suite.sql
-- Pre-migration validation
CREATE OR REPLACE FUNCTION test_pre_migration_state()
RETURNS TABLE(test_name text, status text, details text) AS $$
BEGIN
    -- Verify existing data integrity
    RETURN QUERY
    SELECT 
        'project_equipment_groups_count'::text,
        CASE WHEN count(*) > 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || count(*)::text || ' equipment groups'::text
    FROM project_equipment_groups;
    
    RETURN QUERY
    SELECT 
        'project_roles_count'::text,
        CASE WHEN count(*) > 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || count(*)::text || ' project roles'::text
    FROM project_roles;
    
    -- Test foreign key integrity
    RETURN QUERY
    SELECT 
        'foreign_key_integrity'::text,
        CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Found ' || count(*)::text || ' orphaned records'::text
    FROM project_equipment_groups peg
    LEFT JOIN projects p ON peg.project_id = p.id
    WHERE p.id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Post-migration validation  
CREATE OR REPLACE FUNCTION test_post_migration_state()
RETURNS TABLE(test_name text, status text, details text) AS $$
BEGIN
    -- Verify variant columns added
    RETURN QUERY
    SELECT 
        'variant_columns_added'::text,
        CASE WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'project_equipment_groups' 
            AND column_name = 'variant_name'
        ) THEN 'PASS' ELSE 'FAIL' END::text,
        'Variant columns properly added'::text;
    
    -- Verify default variant creation
    RETURN QUERY
    SELECT 
        'default_variants_created'::text,
        CASE WHEN count(*) > 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Created ' || count(*)::text || ' default variants'::text
    FROM project_variants WHERE variant_name = 'default';
    
    -- Verify data preservation
    RETURN QUERY
    SELECT 
        'data_preservation'::text,
        CASE WHEN 
            (SELECT count(*) FROM project_equipment_groups WHERE variant_name = 'default') =
            (SELECT count(*) FROM test_project_equipment_groups_backup)
        THEN 'PASS' ELSE 'FAIL' END::text,
        'All equipment groups preserved with default variant'::text;
END;
$$ LANGUAGE plpgsql;
```

### **Hook Unit Testing**
```typescript
// src/hooks/__tests__/useProjectVariants.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectVariants } from '../useProjectVariants';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProjectVariants', () => {
  beforeEach(() => {
    // Setup MSW handlers for API mocking
    mockSupabaseQueries();
  });

  test('fetches project variants successfully', async () => {
    const { result } = renderHook(
      () => useProjectVariants('test-project-id'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.variants).toHaveLength(3);
    expect(result.current.variants[0].variant_name).toBe('default');
  });

  test('creates new variant successfully', async () => {
    const { result } = renderHook(
      () => useProjectVariants('test-project-id'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createVariant.mutateAsync({
        variant_name: 'trio',
        display_name: 'Trio Performance'
      });
    });

    expect(mockCreateVariant).toHaveBeenCalledWith('test-project-id', {
      variant_name: 'trio',
      display_name: 'Trio Performance'
    });
  });

  test('handles variant creation errors gracefully', async () => {
    mockCreateVariant.mockRejectedValueOnce(new Error('Duplicate variant'));

    const { result } = renderHook(
      () => useProjectVariants('test-project-id'),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.createVariant.mutateAsync({
          variant_name: 'existing',
          display_name: 'Existing Variant'
        });
      } catch (error) {
        expect(error.message).toBe('Duplicate variant');
      }
    });
  });

  test('switches selected variant correctly', () => {
    const { result } = renderHook(
      () => useProjectVariants('test-project-id'),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.setSelectedVariant('trio');
    });

    expect(result.current.selectedVariant).toBe('trio');
  });
});
```

### **Integration Testing for Database Operations**
```typescript
// src/hooks/__tests__/integration/variantOperations.integration.test.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

describe('Variant Operations Integration', () => {
  let supabase: SupabaseClient<Database>;
  let testProjectId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_ANON_KEY!
    );
    
    // Create test project
    const { data: project } = await supabase
      .from('projects')
      .insert({ name: 'Test Artist Project', project_type: 'artist' })
      .select()
      .single();
    
    testProjectId = project.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('projects').delete().eq('id', testProjectId);
  });

  test('complete variant workflow', async () => {
    // 1. Create variant
    const { data: variant, error: createError } = await supabase
      .from('project_variants')
      .insert({
        project_id: testProjectId,
        variant_name: 'trio',
        display_name: 'Trio Performance'
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(variant.variant_name).toBe('trio');

    // 2. Add crew role for variant
    const { error: roleError } = await supabase
      .from('project_roles')
      .insert({
        project_id: testProjectId,
        role_id: 'test-role-id',
        variant_name: 'trio',
        daily_rate: 1500
      });

    expect(roleError).toBeNull();

    // 3. Add equipment for variant
    const { error: equipmentError } = await supabase
      .from('project_equipment')
      .insert({
        project_id: testProjectId,
        equipment_id: 'test-equipment-id',
        variant_name: 'trio',
        quantity: 2
      });

    expect(equipmentError).toBeNull();

    // 4. Verify variant data integrity
    const { data: variantData } = await supabase
      .from('project_variants')
      .select(`
        *,
        project_roles(*),
        project_equipment(*)
      `)
      .eq('project_id', testProjectId)
      .eq('variant_name', 'trio')
      .single();

    expect(variantData.project_roles).toHaveLength(1);
    expect(variantData.project_equipment).toHaveLength(1);
  });
});
```

---

## **🎨 PHASE 2: UI COMPONENT TESTING**

### **Component Unit Testing**
```typescript
// src/components/projects/detail/resources/__tests__/VariantSelector.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VariantSelector } from '../VariantSelector';

const mockVariants = [
  { id: '1', variant_name: 'default', display_name: 'Standard', is_default: true },
  { id: '2', variant_name: 'trio', display_name: 'Trio', is_default: false },
  { id: '3', variant_name: 'band', display_name: 'Full Band', is_default: false }
];

describe('VariantSelector', () => {
  const defaultProps = {
    variants: mockVariants,
    selectedVariant: 'default',
    onVariantChange: jest.fn(),
    projectId: 'test-project-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all variants as buttons', () => {
    render(<VariantSelector {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Standard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Full Band' })).toBeInTheDocument();
  });

  test('highlights selected variant', () => {
    render(<VariantSelector {...defaultProps} selectedVariant="trio" />);

    const trioButton = screen.getByRole('button', { name: 'Trio' });
    const standardButton = screen.getByRole('button', { name: 'Standard' });

    expect(trioButton).toHaveClass('bg-primary'); // Active state
    expect(standardButton).not.toHaveClass('bg-primary'); // Inactive state
  });

  test('calls onVariantChange when variant is selected', async () => {
    const user = userEvent.setup();
    render(<VariantSelector {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Trio' }));

    expect(defaultProps.onVariantChange).toHaveBeenCalledWith('trio');
  });

  test('opens add variant dialog when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<VariantSelector {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /add variant/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/variant name/i)).toBeInTheDocument();
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<VariantSelector {...defaultProps} />);

    const standardButton = screen.getByRole('button', { name: 'Standard' });
    
    standardButton.focus();
    await user.keyboard('{ArrowRight}');
    
    expect(screen.getByRole('button', { name: 'Trio' })).toHaveFocus();
  });
});
```

### **Accessibility Testing**
```typescript
// src/components/projects/detail/resources/__tests__/accessibility.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ResourcesTab } from '../ResourcesTab';

expect.extend(toHaveNoViolations);

describe('Resources Tab Accessibility', () => {
  test('has no accessibility violations', async () => {
    const { container } = render(
      <ResourcesTab projectId="test-id" project={mockArtistProject} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('supports screen reader navigation', () => {
    render(<ResourcesTab projectId="test-id" project={mockArtistProject} />);

    // Verify ARIA landmarks
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();

    // Verify tab accessibility
    const tabs = screen.getAllByRole('tab');
    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute('aria-selected');
      expect(tab).toHaveAttribute('aria-controls');
      expect(tab).toHaveAttribute('id');
    });
  });

  test('maintains focus management in dialogs', async () => {
    const user = userEvent.setup();
    render(<ResourcesTab projectId="test-id" project={mockArtistProject} />);

    // Open variant dialog
    await user.click(screen.getByRole('button', { name: /add variant/i }));

    // Focus should be trapped in dialog
    const dialog = screen.getByRole('dialog');
    const firstFocusable = screen.getByLabelText(/variant name/i);
    
    expect(firstFocusable).toHaveFocus();
    
    // Escape should close dialog and restore focus
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

---

## **🔄 PHASE 3: SYNC SYSTEM TESTING**

### **Sync Operation Testing**
```typescript
// src/hooks/__tests__/useVariantSync.test.ts
describe('useVariantSync', () => {
  test('syncs variant resources to event successfully', async () => {
    const { result } = renderHook(() => useVariantSync('test-project-id'));

    await act(async () => {
      await result.current.syncVariantToEvent({
        projectId: 'test-project-id',
        eventId: 'test-event-id',
        variantName: 'trio'
      });
    });

    // Verify crew roles were synced
    expect(mockSyncCrewRoles).toHaveBeenCalledWith({
      projectId: 'test-project-id',
      eventId: 'test-event-id',
      variantName: 'trio'
    });

    // Verify equipment was synced
    expect(mockSyncEquipment).toHaveBeenCalledWith({
      projectId: 'test-project-id',
      eventId: 'test-event-id',
      variantName: 'trio'
    });
  });

  test('handles sync conflicts gracefully', async () => {
    mockSyncCrewRoles.mockRejectedValueOnce(new Error('Crew member already assigned'));

    const { result } = renderHook(() => useVariantSync('test-project-id'));

    await act(async () => {
      const syncResult = await result.current.syncVariantToEvent({
        projectId: 'test-project-id',
        eventId: 'test-event-id',
        variantName: 'trio'
      });

      expect(syncResult.conflicts).toHaveLength(1);
      expect(syncResult.conflicts[0].type).toBe('crew_assignment');
    });
  });

  test('provides sync progress updates', async () => {
    const onProgress = jest.fn();
    const { result } = renderHook(() => useVariantSync('test-project-id'));

    await act(async () => {
      await result.current.syncVariantToEvent({
        projectId: 'test-project-id',
        eventId: 'test-event-id',
        variantName: 'trio',
        onProgress
      });
    });

    expect(onProgress).toHaveBeenCalledWith({ step: 'crew', progress: 50 });
    expect(onProgress).toHaveBeenCalledWith({ step: 'equipment', progress: 100 });
  });
});
```

### **Integration Testing with Calendar**
```typescript
// src/components/calendar/__tests__/integration/variantCalendar.integration.test.tsx
describe('Calendar Variant Integration', () => {
  test('displays variant information in event cards', () => {
    const eventWithVariant = {
      ...mockEvent,
      variant_name: 'trio',
      variant_display_name: 'Trio Performance'
    };

    render(<CalendarView events={[eventWithVariant]} />);

    expect(screen.getByText('Trio Performance')).toBeInTheDocument();
    expect(screen.getByTestId('variant-indicator')).toBeInTheDocument();
  });

  test('allows variant switching from event dialog', async () => {
    const user = userEvent.setup();
    render(<CalendarView events={[mockEvent]} />);

    // Open event dialog
    await user.click(screen.getByText(mockEvent.name));

    // Change variant
    await user.click(screen.getByRole('combobox', { name: /variant/i }));
    await user.click(screen.getByRole('option', { name: 'Trio Performance' }));

    expect(mockUpdateEventVariant).toHaveBeenCalledWith({
      eventId: mockEvent.id,
      variantName: 'trio'
    });
  });
});
```

---

## **🎯 PHASE 4: END-TO-END TESTING**

### **Complete User Workflows**
```typescript
// e2e/variant-workflows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Project Variants End-to-End', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/projects/test-artist-project');
    await page.waitForLoadState('networkidle');
  });

  test('complete variant creation and usage workflow', async ({ page }) => {
    // Navigate to Resources tab
    await page.click('[data-testid="resources-tab"]');

    // Create new variant
    await page.click('[data-testid="add-variant-button"]');
    await page.fill('[data-testid="variant-name-input"]', 'acoustic');
    await page.fill('[data-testid="variant-display-name-input"]', 'Acoustic Set');
    await page.click('[data-testid="create-variant-button"]');

    // Wait for variant to be created
    await expect(page.locator('[data-testid="variant-acoustic"]')).toBeVisible();

    // Select the new variant
    await page.click('[data-testid="variant-acoustic"]');

    // Add crew role to variant
    await page.click('[data-testid="add-crew-role-button"]');
    await page.selectOption('[data-testid="role-select"]', 'guitarist');
    await page.fill('[data-testid="daily-rate-input"]', '1200');
    await page.click('[data-testid="save-role-button"]');

    // Verify role appears in crew section
    await expect(page.locator('[data-testid="crew-role-guitarist"]')).toBeVisible();

    // Add equipment to variant
    await page.click('[data-testid="add-equipment-button"]');
    await page.selectOption('[data-testid="equipment-select"]', 'acoustic-guitar');
    await page.fill('[data-testid="quantity-input"]', '2');
    await page.click('[data-testid="save-equipment-button"]');

    // Verify equipment appears in equipment section
    await expect(page.locator('[data-testid="equipment-acoustic-guitar"]')).toBeVisible();

    // Create event using this variant
    await page.goto('/projects/test-artist-project/calendar');
    await page.click('[data-testid="add-event-button"]');
    await page.fill('[data-testid="event-name-input"]', 'Acoustic Session');
    await page.selectOption('[data-testid="variant-select"]', 'acoustic');
    await page.click('[data-testid="create-event-button"]');

    // Verify event was created with variant resources
    await expect(page.locator('[data-testid="event-acoustic-session"]')).toBeVisible();
    await page.click('[data-testid="event-acoustic-session"]');
    
    // Check that crew and equipment were synced from variant
    await expect(page.locator('[data-testid="event-crew-guitarist"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-equipment-acoustic-guitar"]')).toBeVisible();
  });

  test('variant switching preserves data integrity', async ({ page }) => {
    // Start with trio variant
    await page.click('[data-testid="resources-tab"]');
    await page.click('[data-testid="variant-trio"]');

    // Add some crew and equipment
    await addCrewRole(page, 'drummer', '1500');
    await addEquipment(page, 'drum-kit', '1');

    // Switch to band variant
    await page.click('[data-testid="variant-band"]');

    // Verify trio data is not visible
    await expect(page.locator('[data-testid="crew-role-drummer"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="equipment-drum-kit"]')).not.toBeVisible();

    // Add different resources to band
    await addCrewRole(page, 'bassist', '1400');
    await addEquipment(page, 'bass-guitar', '1');

    // Switch back to trio
    await page.click('[data-testid="variant-trio"]');

    // Verify trio data is preserved
    await expect(page.locator('[data-testid="crew-role-drummer"]')).toBeVisible();
    await expect(page.locator('[data-testid="equipment-drum-kit"]')).toBeVisible();

    // Verify band data is not visible
    await expect(page.locator('[data-testid="crew-role-bassist"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="equipment-bass-guitar"]')).not.toBeVisible();
  });
});
```

### **Performance Testing**
```typescript
// performance/variant-performance.test.ts
describe('Variant System Performance', () => {
  test('variant switching performance', async () => {
    const startTime = performance.now();
    
    // Switch between variants multiple times
    for (let i = 0; i < 10; i++) {
      await switchVariant('trio');
      await switchVariant('band');
      await switchVariant('dj');
    }
    
    const endTime = performance.now();
    const averageTime = (endTime - startTime) / 30; // 30 total switches
    
    expect(averageTime).toBeLessThan(100); // <100ms per switch
  });

  test('large project variant performance', async () => {
    // Create project with 50 crew roles and 100 equipment items per variant
    const largeProject = await createLargeTestProject();
    
    const startTime = performance.now();
    await loadVariantData(largeProject.id, 'band');
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(500); // <500ms for large datasets
  });

  test('bundle size impact', () => {
    const bundleAnalysis = analyzeBundleSize();
    
    expect(bundleAnalysis.increase).toBeLessThan(0.05); // <5% increase
    expect(bundleAnalysis.newChunks).toContain('variant-components'); // Proper code splitting
  });
});
```

---

## **📊 CONTINUOUS TESTING SETUP**

### **CI/CD Pipeline Integration**
```yaml
# .github/workflows/variant-testing.yml
name: Variant System Testing

on:
  push:
    branches: [feature/project-detail-pages-transformation]
  pull_request:
    branches: [main]

jobs:
  database-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - name: Setup Supabase CLI
        run: npm install -g @supabase/cli
      - name: Start Supabase
        run: supabase start
      - name: Run migration tests
        run: npm run test:migrations
      - name: Run database integration tests
        run: npm run test:db-integration

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      - name: Run component tests
        run: npm run test:components
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload E2E results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run performance benchmarks
        run: npm run test:performance
      - name: Analyze bundle size
        run: npm run analyze:bundle
```

---

## **🚨 QUALITY GATES**

### **Phase Completion Criteria**

#### **Phase 1: Database & Hooks**
- [ ] 100% migration script tests pass
- [ ] 95%+ hook unit test coverage
- [ ] All integration tests pass
- [ ] Performance benchmarks meet targets

#### **Phase 2: UI Components**
- [ ] 90%+ component test coverage
- [ ] Zero accessibility violations
- [ ] All user interaction flows tested
- [ ] Cross-browser compatibility verified

#### **Phase 3: Sync System**
- [ ] All sync workflows tested end-to-end
- [ ] Conflict resolution scenarios covered
- [ ] Performance under load validated
- [ ] Error handling comprehensive

#### **Phase 4: Integration**
- [ ] Complete user journey testing
- [ ] Production-like environment testing
- [ ] Security validation complete
- [ ] Documentation and training materials ready

---

**Next Steps**: Set up testing infrastructure and begin Phase 1 database migration testing.