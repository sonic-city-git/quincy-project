#!/bin/bash

# QUINCY Database Restore Script
# Created: August 7, 2025
# Backup from: Variant system overhaul completion

set -e

echo "🗄️  QUINCY Database Restore Script"
echo "=================================="
echo ""

# Get backup directory (same as script location)
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "📁 Backup directory: $BACKUP_DIR"

# Check if Supabase is running
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    exit 1
fi

# Get database URL
if [ -z "$DATABASE_URL" ]; then
    echo "🔍 Getting database URL from Supabase..."
    DB_URL=$(supabase status | grep "DB URL" | cut -d'|' -f3 | xargs)
    if [ -z "$DB_URL" ]; then
        echo "❌ Could not get database URL. Make sure Supabase is running."
        echo "   Try: supabase start"
        exit 1
    fi
else
    DB_URL="$DATABASE_URL"
fi

echo "🔗 Database URL: ${DB_URL:0:30}..."
echo ""

# Restore options
echo "Choose restore method:"
echo "1) Schema + Data (recommended)"
echo "2) Data only (requires existing schema)"
echo "3) Schema only"
echo "4) Reset + Migrations + Data"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🔄 Restoring schema + data..."
        echo "📋 Step 1: Restoring schema..."
        psql "$DB_URL" < "$BACKUP_DIR/quincy_database_backup_20250807_011134.sql"
        echo "📊 Step 2: Restoring data (with trigger disable)..."
        psql "$DB_URL" -c "SET session_replication_role = replica;"
        psql "$DB_URL" < "$BACKUP_DIR/quincy_data_backup_20250807_011149.sql"
        psql "$DB_URL" -c "SET session_replication_role = DEFAULT;"
        echo "✅ Full restore completed!"
        ;;
    2)
        echo "📊 Restoring data only..."
        psql "$DB_URL" -c "SET session_replication_role = replica;"
        psql "$DB_URL" < "$BACKUP_DIR/quincy_data_backup_20250807_011149.sql"
        psql "$DB_URL" -c "SET session_replication_role = DEFAULT;"
        echo "✅ Data restore completed!"
        ;;
    3)
        echo "📋 Restoring schema only..."
        psql "$DB_URL" < "$BACKUP_DIR/quincy_database_backup_20250807_011134.sql"
        echo "✅ Schema restore completed!"
        ;;
    4)
        echo "🔄 Full reset + migrations + data..."
        echo "⚠️  This will completely reset your database!"
        read -p "Are you sure? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            echo "🔄 Resetting database..."
            supabase db reset --linked
            echo "📋 Applying migrations..."
            supabase db push --linked
            echo "📊 Restoring data..."
            psql "$DB_URL" -c "SET session_replication_role = replica;"
            psql "$DB_URL" < "$BACKUP_DIR/quincy_data_backup_20250807_011149.sql"
            psql "$DB_URL" -c "SET session_replication_role = DEFAULT;"
            echo "✅ Complete reset + restore completed!"
        else
            echo "❌ Reset cancelled."
        fi
        ;;
    *)
        echo "❌ Invalid choice."
        exit 1
        ;;
esac

echo ""
echo "🎉 Database restore completed successfully!"
echo "📝 Check the BACKUP_README.md for more details."