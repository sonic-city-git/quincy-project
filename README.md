# QUINCY - Production Logistics Management System

## Overview
QUINCY is an intelligent system for managing production logistics in the entertainment industry, designed to handle the complexity of audio/crew/equipment logistics for touring bands and media productions.

## Core Purpose
[Addressing industry pain points][[memory:7394403115262325804]] in managing complex productions with clarity, automation, and minimal friction.

## Key Features
- 🎯 Real-time scheduling with conflict detection
- 👥 Comprehensive crew management and role assignment
- 📦 Equipment logistics and availability tracking
- 💰 Integrated pricing and Tripletex-ready invoicing
- 🔍 Multi-dimensional filtering (manager, event type, client, gear)
- 🔄 Live updates and reactive behavior

## Guiding Principles
[Our core principles][[memory:7136736271792394336]] shape every aspect of QUINCY:

### 🧠 Prompt-First Design
- All system logic begins as natural language prompts
- AI-friendly architecture for future extensibility
- Clear documentation and modular design

### 🎛️ Industry-Accurate Calculations
- Support for complex pricing structures
- Overtime rules and event multipliers
- Role-based rates and dry hire logic

### 🧩 Modularity & Composability
- Independent yet interoperable modules
- Projects, Events, Crew, Equipment
- Clean separation of concerns

### 🔒 Reliability by Default
- Strict database constraints
- Real-time conflict detection
- Comprehensive audit trails

### 🌓 Minimal, Professional UI
- Dark mode by default
- Focus on clarity and efficiency
- Professional and elegant design

### ⚙️ Real-Time Operational Sync
- Live updates via Supabase subscriptions
- Instant recalculation of dependencies
- Reactive data flow

### 🚪 Role-Based Simplicity
Different views for different roles:
- Production Managers: Full project overview
- Crew Members: Personal schedule and tasks
- Finance Team: Invoicing and reporting

### 🧾 Seamless Financial Flow
- Native Tripletex integration
- Real-time financial tracking
- Automated invoice generation

## Tech Stack
- Frontend: React + TypeScript + Vite
- UI: shadcn/ui + Tailwind CSS
- State: TanStack Query
- Backend: Supabase
- Real-time: Supabase Realtime
- Auth: Supabase Auth

## Getting Started

### Prerequisites
- Node.js 18+
- npm or bun
- Supabase account

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Setup
Configure the following environment variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TRIPLETEX_API_URL=your_tripletex_api_url
```

## Development Workflow
1. All new features start with a prompt in `/docs/prompts`
2. Follow the PDSD (Prompt-Derived System Design) framework
3. Maintain modular architecture and clear documentation
4. Ensure real-world testing with industry scenarios

## Contributing
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with clear description
4. Follow the prompt-first design approach

## License
Proprietary - All rights reserved

## Support
For support or feature requests, please contact the development team.
