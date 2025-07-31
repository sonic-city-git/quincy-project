# Calendar Module Prompt

## Purpose
Manage event scheduling and resource allocation across projects with real-time conflict detection.

## Context
The calendar is the central scheduling interface for:
- Event planning
- Resource allocation
- Conflict detection
- Availability tracking

## Input Parameters
- Event details
  - Date and time
  - Duration
  - Location
  - Type
- Resource assignments
  - Crew members
  - Equipment
  - Venues
- View preferences
  - Time scale
  - Resource filters
  - Group by options

## Expected Behavior
- Drag-and-drop scheduling
- Real-time conflict detection
- Resource availability check
- Multi-view calendar display
- Event status management

## Edge Cases
- Overlapping events
- Resource double-booking
- Time zone handling
- Recurring events
- Multi-day events

## Example Usage
```tsx
<ProjectCalendar>
  <CalendarHeader />
  <EventList>
    <EventCard>
      <EventHeader />
      <EventActions />
      <EventStatus />
    </EventCard>
  </EventList>
  <EventManagementDialog />
</ProjectCalendar>
```

## Business Rules
- Booking constraints
- Resource availability
- Event dependencies
- Status workflows
- Access permissions

## AI Role
- Optimize scheduling
- Predict conflicts
- Suggest alternatives
- Balance resources
- Track patterns 