# QUINCY Principles

[Our core principles][[memory:7136736271792394336]] guide every aspect of QUINCY's development and operation.

## 🧠 Prompt-First Design

### Philosophy
All system components begin as natural language prompts, ensuring:
- Clear intent and purpose
- AI-friendly architecture
- Maintainable codebase
- Consistent documentation

### Implementation
- Store prompts in `/docs/prompts`
- Use PDSD framework for features
- Maintain prompt-derived documentation
- Enable AI-assisted development

## 🎛️ Industry-Accurate Calculations

### Rate Calculations
- Support for hourly vs. daily rates
- Overtime rules and multipliers
- Role-based rate differentiation
- Holiday and weekend premiums

### Equipment Pricing
- Daily/weekly/monthly rates
- Package discounts
- Dry hire calculations
- Damage/insurance costs

## 🧩 Modularity & Composability

### Module Independence
- Self-contained business logic
- Clear interface contracts
- Independent state management
- Isolated testing capability

### Module Integration
- Standardized data flow
- Event-driven communication
- Shared type definitions
- Consistent error handling

## 🔒 Reliability by Default

### Database Constraints
- No double bookings
- Required field validation
- Referential integrity
- Audit trail logging

### Real-time Feedback
- Instant conflict detection
- Live availability updates
- Rate calculation previews
- Error notifications

## 🌓 Minimal, Professional UI

### Design Principles
- Dark theme optimized
- Clear visual hierarchy
- Consistent component usage
- Professional aesthetics

### User Experience
- Minimal click paths
- Logical workflows
- Keyboard shortcuts
- Responsive design

## ⚙️ Real-Time Operational Sync

### Data Flow
- Supabase real-time subscriptions
- Optimistic UI updates
- Conflict resolution
- Background sync

### State Management
- TanStack Query for server state
- React state for UI
- Subscription management
- Cache invalidation

## 🚪 Role-Based Simplicity

### User Roles
- Production Manager
  - Full system access
  - Resource allocation
  - Financial oversight
- Crew Member
  - Schedule view
  - Availability management
  - Equipment assignments
- Finance
  - Invoice generation
  - Rate management
  - Report access

### Access Control
- Role-based permissions
- Feature visibility
- Data access limits
- Action restrictions

## 🧾 Seamless Financial Flow

### Tripletex Integration
- Bi-directional sync
- Real-time rate updates
- Automated invoicing
- Financial reporting

### Financial Tracking
- Project budgeting
- Cost calculations
- Revenue forecasting
- Expense tracking

## Implementation Guidelines

### Code Structure
- Follow module boundaries
- Use TypeScript strictly
- Implement proper error handling
- Write comprehensive tests

### UI Components
- Use shadcn/ui components
- Follow dark theme guidelines
- Maintain accessibility
- Ensure responsiveness

### State Management
- Use TanStack Query
- Implement Supabase subscriptions
- Handle offline scenarios
- Manage loading states

### Documentation
- Keep prompts up-to-date
- Document business logic
- Maintain type definitions
- Update PDSD documentation 