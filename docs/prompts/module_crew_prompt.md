# Crew Module Prompt

## Purpose
Manage crew members, roles, assignments, and availability across production projects.

## Context
The crew module handles all personnel-related aspects:
- Member profiles
- Role assignments
- Availability tracking
- Rate management

## Input Parameters
- Crew member details
  - Name
  - Contact info
  - Roles
  - Availability
- Role definitions
  - Title
  - Requirements
  - Rates
  - Permissions
- Assignment criteria
  - Project needs
  - Time periods
  - Location
  - Skills

## Expected Behavior
- Member CRUD operations
- Role management
- Availability tracking
- Assignment handling
- Rate calculations

## Edge Cases
- Role conflicts
- Availability clashes
- Rate variations
- Skill mismatches
- Schedule changes

## Example Usage
```tsx
<CrewList>
  <CrewListHeader>
    <CrewActions />
    <CrewFilters />
  </CrewListHeader>
  <CrewTable>
    <CrewTableHeader />
    <CrewTableRow>
      <CrewMemberInfo />
      <RoleList />
      <AvailabilityStatus />
    </CrewTableRow>
  </CrewTable>
</CrewList>
```

## Business Rules
- Role hierarchies
- Rate structures
- Availability rules
- Assignment priorities
- Skill requirements

## AI Role
- Suggest assignments
- Detect scheduling conflicts
- Optimize role distribution
- Track utilization
- Analyze performance 