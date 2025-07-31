# Project Management Module Prompt

## Purpose
Manage the complete lifecycle of production projects, from planning to execution and closure.

## Context
Projects are the core organizational unit in QUINCY, containing:
- Events and schedules
- Resource assignments
- Financial tracking
- Client information

## Input Parameters
- Project details
  - Name
  - Client
  - Owner
  - Date range
  - Status
- Resource requirements
  - Crew roles
  - Equipment needs
  - Venue details
- Financial parameters
  - Rates
  - Budget
  - Invoice settings

## Expected Behavior
- Project CRUD operations
- Resource allocation
- Conflict detection
- Financial calculations
- Status tracking

## Edge Cases
- Resource conflicts
- Date overlaps
- Budget overruns
- Client changes
- Status transitions

## Example Usage
```tsx
<ProjectDetail>
  <ProjectHeader />
  <ProjectTabs>
    <GeneralTab />
    <EquipmentTab />
    <CrewTab />
    <FinancialTab />
  </ProjectTabs>
</ProjectDetail>
```

## Business Rules
- Project ownership rules
- Resource allocation limits
- Rate calculations
- Status transitions
- Access control

## AI Role
- Suggest resource optimization
- Detect potential conflicts
- Recommend scheduling
- Calculate costs
- Generate reports 