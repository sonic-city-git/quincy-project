#!/bin/bash

# Script to enable full variant system and structured location data functionality
# Run this after ALL pending migrations have been applied to the database

echo "🔧 Enabling full variant system and structured location data functionality..."

# Replace the disabled location_data logic in createEvent
sed -i '' 's/if (locationData && false)/if (locationData)/g' src/utils/eventQueries.ts

# Replace the disabled location_data logic in updateEvent  
sed -i '' 's/if (updatedEvent.location_data !== undefined && false)/if (updatedEvent.location_data !== undefined)/g' src/utils/eventQueries.ts

# Update sync functions to use variant_id instead of variant_name (after function migration)
sed -i '' 's/p_variant_name: variantName/p_variant_id: variant.id/g' src/utils/eventQueries.ts

echo "✅ Full functionality enabled!"
echo ""
echo "📋 What was enabled:"
echo "- Event creation now stores structured city data (coordinates, country, place ID)"
echo "- Event updates handle structured location data"
echo "- Analytics-ready location data is preserved"
echo "- Sync functions now use proper UUID variant_id parameters"
echo "- Complete variant system with proper foreign key relationships"
echo ""
echo "🗄️ Database schema required:"
echo "- location_data JSONB column in project_events table"
echo "- Updated sync functions using variant_id parameters"
echo "- Proper foreign key constraints between project_events and project_variants"
echo "- Indexes for performance optimization"
echo ""
echo "🚀 To apply the database migrations:"
echo "  supabase db push"
echo ""
echo "🔍 Current status:"
echo "- Events: ✅ Creating with location and variant_id"
echo "- Sync functions: ⚠️  Using variant_name (legacy mode)"
echo "- Location data: ⚠️  Display name only (legacy mode)"