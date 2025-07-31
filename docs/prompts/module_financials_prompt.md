# Financials Module Prompt

## Purpose
Manage financial aspects of production projects, including rates, invoicing, and Tripletex integration.

## Context
The financials module handles all monetary aspects:
- Rate calculations
- Invoice generation
- Budget tracking
- Tripletex sync

## Input Parameters
- Rate structures
  - Hourly rates
  - Daily rates
  - Role-based rates
  - Equipment rates
- Invoice settings
  - Client details
  - Payment terms
  - Tax rules
  - Currency
- Budget parameters
  - Project budgets
  - Cost centers
  - Expense categories
  - Revenue targets

## Expected Behavior
- Rate calculations
- Invoice generation
- Budget tracking
- Tripletex synchronization
- Financial reporting

## Edge Cases
- Rate variations
- Currency conversion
- Tax calculations
- Discount handling
- Payment tracking

## Example Usage
```tsx
<FinancialTab>
  <RateCalculator />
  <InvoiceGenerator>
    <InvoiceSummary />
    <InvoiceDetails />
    <TripletexSync />
  </InvoiceGenerator>
  <BudgetTracker>
    <RevenueOverview />
    <CostBreakdown />
  </BudgetTracker>
</FinancialTab>
```

## Business Rules
- Rate calculations
  - Base rates
  - Overtime rules
  - Holiday multipliers
  - Role premiums
- Invoice rules
  - Number sequences
  - Due dates
  - Payment terms
  - Tax handling
- Budget controls
  - Approval limits
  - Cost tracking
  - Variance alerts
  - Forecast rules

## AI Role
- Calculate optimal rates
- Predict revenue
- Detect anomalies
- Suggest optimizations
- Generate reports 