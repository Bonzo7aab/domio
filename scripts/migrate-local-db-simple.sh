#!/bin/bash

# Simple migration script using Supabase Studio
# This provides instructions for manual migration via the web UI

set -e

echo "🔄 Migration Guide for Local Supabase"
echo ""

# Check if Supabase is running
STATUS_OUTPUT=$(supabase status 2>&1)
if [ $? -ne 0 ] || echo "$STATUS_OUTPUT" | grep -q "not running\|not found\|stopped"; then
    echo "❌ Local Supabase is not running."
    echo ""
    echo "Please start it first:"
    echo "   npm run supabase:start"
    echo ""
    exit 1
fi

echo "✅ Supabase is running!"
echo ""
echo "📋 To apply migrations:"
echo ""
echo "Option 1: Via Supabase Studio (Easiest)"
echo "   1. Open: http://localhost:54323"
echo "   2. Go to SQL Editor"
echo "   3. Copy and paste each migration file in order:"
echo ""

# List migration files
MIGRATIONS=(
    "01_core_tables.sql"
    "02_communication.sql"
    "03_file_management.sql"
    "04_security_policies.sql"
    "05_sample_data.sql"
    "08_comprehensive_job_tender_data.sql"
    "09_fix_company_insert_policy.sql"
    "26_buildings_table.sql"
    "27_add_building_images.sql"
    "28_building_images_storage.sql"
    "29_fix_company_buildings_rls.sql"
    "30_fix_building_images_storage_rls.sql"
    "31_job_attachments_storage.sql"
    "32_verification_documents_storage.sql"
    "33_add_company_is_public.sql"
    "34_update_company_rls_for_public_profiles.sql"
    "35_fix_portfolio_projects_rls.sql"
    "36_fix_storage_rls_for_portfolio.sql"
    "37_add_cancelled_status.sql"
    "38_allow_contractors_cancel_bids_applications.sql"
    "39_service_pricing.sql"
    "40_update_application_counts.sql"
)

for i in "${!MIGRATIONS[@]}"; do
    migration="${MIGRATIONS[$i]}"
    if [ -f "database/$migration" ]; then
        printf "   %2d. database/%s\n" $((i+1)) "$migration"
    fi
done

echo ""
echo "Option 2: Using psql (if installed)"
echo "   Install: brew install postgresql"
echo "   Then run: npm run supabase:migrate-local"
echo ""
echo "💡 Tip: After applying migrations, verify with:"
echo "   npm run supabase:status"
echo ""

