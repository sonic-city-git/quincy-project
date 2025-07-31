# Dashboard Module Prompt

## Purpose
Generate and manage the dashboard interface for QUINCY, providing real-time insights into production logistics.

## Context
The dashboard is the central hub for monitoring:
- Revenue overview
- Equipment conflicts
- Empty crew roles
- Project status
- Resource utilization

## Input Parameters
- Owner/manager filter
- Date range
- Project status
- Resource types (crew, equipment)

## Expected Behavior
- Real-time updates via Supabase subscriptions
- Responsive data visualization
- Interactive filtering
- Clear status indicators

## Edge Cases
- Handle loading states
- Empty data scenarios
- Error boundaries
- Subscription reconnection

## Example Usage
```tsx
<DashboardLayout>
  <DashboardFilter />
  <RevenueChart />
  <EquipmentConflicts />
  <EmptyCrewRoles />
</DashboardLayout>
```

## AI Role
- Monitor data patterns
- Suggest optimizations
- Detect anomalies
- Provide insights 