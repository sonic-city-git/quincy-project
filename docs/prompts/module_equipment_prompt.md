# Equipment Module Prompt

## Purpose
Manage equipment inventory, allocation, and tracking across production projects.

## Context
The equipment module handles all asset-related functionality:
- Inventory management
- Equipment allocation
- Maintenance tracking
- Conflict prevention

## Input Parameters
- Equipment details
  - Name
  - Category
  - Code
  - Status
- Folder structure
  - Main categories
  - Subcategories
  - Sorting rules
- Allocation rules
  - Availability
  - Compatibility
  - Dependencies
  - Restrictions

## Expected Behavior
- Equipment CRUD operations
- Folder management
- Availability tracking
- Conflict detection
- Status updates

## Edge Cases
- Double booking
- Maintenance periods
- Dependency conflicts
- Category changes
- Status transitions

## Example Usage
```tsx
<EquipmentList>
  <EquipmentListHeader>
    <EquipmentActions />
    <EquipmentFilters />
  </EquipmentListHeader>
  <EquipmentTable>
    <EquipmentTableHeader />
    <EquipmentTableRow>
      <EquipmentInfo />
      <FolderInfo />
      <StatusIndicator />
    </EquipmentTableRow>
  </EquipmentTable>
</EquipmentList>
```

## Business Rules
- Folder hierarchies
  - Mixers
  - Microphones
  - DI-boxes
  - Cables/Split
  - WL
  - Outboard
  - Stands/Clamps
  - Misc
  - Flightcases
  - Consumables
  - Kits
  - Mindnes

- Subfolder rules
  - Mixers: [Mixrack, Surface, Expansion, Small format]
  - Microphones: [Dynamic, Condenser, Ribbon, Shotgun, WL capsule, Special/Misc]
  - DI-boxes: [Active, Passive, Special]
  - Cables/Split: [CAT, XLR, LK37/SB, Jack, Coax, Fibre, Schuko]
  - WL: [MIC, IEM, Antenna]

- Allocation rules
  - Availability periods
  - Package dependencies
  - Maintenance windows
  - Access restrictions

## AI Role
- Suggest equipment combinations
- Detect allocation conflicts
- Optimize inventory usage
- Track maintenance needs
- Analyze utilization patterns 