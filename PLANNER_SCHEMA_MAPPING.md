# 🏗️ QUINCY PLANNER: DEFINITIVE SCHEMA MAPPING

## ✅ **CORRECT DATABASE RELATIONSHIPS**

### **Crew Data Flow**
```sql
-- Crew Members
crew_members (id, name, folder_id, avatar_url, email, phone)
  └── crew_folders (id, name) via folder_id

-- Crew Roles & Assignments  
crew_roles (id, name, color)
crew_member_roles (crew_member_id, role_id) -- Junction table
project_event_roles (crew_member_id, role_id, event_id, project_id, daily_rate)
  ├── crew_members via crew_member_id
  ├── crew_roles via role_id  
  ├── project_events via event_id
  └── projects via project_id
```

### **Equipment Data Flow**
```sql
-- Equipment Items
equipment (id, name, stock, folder_id)
  └── equipment_folders (id, name) via folder_id

-- Equipment Assignments
project_event_equipment (equipment_id, event_id, project_id, quantity)
  ├── equipment via equipment_id
  ├── project_events via event_id
  └── projects via project_id
```

### **Event & Project Structure**
```sql
projects (id, name, color, owner_id, customer_id)
project_events (id, name, date, project_id, event_type_id, location)
  ├── projects via project_id
  └── event_types via event_type_id
```

## ❌ **INCORRECT USAGE TO FIX**

### **Tables That Don't Exist**
- `crew_assignments` → Use `project_event_roles`
- `equipment_bookings` → Use `project_event_equipment`

### **Incorrect Foreign Key Names**
- `folders!crew_members_folder_id_fkey` → `crew_folders!crew_members_folder_id_fkey`
- `folders!equipment_folder_id_fkey` → `equipment_folders!equipment_folder_id_fkey`

### **Missing Columns**
- `projects.status` → Doesn't exist (removed from schema)

## 🎯 **CORRECT QUERY PATTERNS**

### **Crew Assignments Query**
```typescript
supabase
  .from('project_event_roles')
  .select(`
    id,
    crew_member_id,
    role_id,
    daily_rate,
    project_events!inner (
      date,
      name,
      project:projects!inner (name)
    ),
    crew_roles (name, color)
  `)
```

### **Equipment Bookings Query**  
```typescript
supabase
  .from('project_event_equipment')
  .select(`
    id,
    equipment_id,
    quantity,
    project_events!inner (
      date,
      name,
      project:projects!inner (name)
    )
  `)
```

### **Crew Members with Departments**
```typescript
supabase
  .from('crew_members')
  .select(`
    id,
    name,
    email,
    phone,
    avatar_url,
    folder_id,
    crew_folders (id, name)
  `)
```

## 🚀 **ACTION ITEMS**

1. ✅ **Update all V1 hooks** to use correct table names
2. 🗑️ **Delete V2/Generic implementations** (incomplete/broken)
3. 🔒 **Type-safe query builders** for each resource type
4. 📊 **Performance optimization** with proper caching keys