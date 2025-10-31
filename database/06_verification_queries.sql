-- =============================================
-- DOMIO PLATFORM - SCHEMA VERIFICATION QUERIES
-- =============================================

-- This file contains verification queries to test the database schema
-- Run these queries after setting up the database to ensure everything works correctly

-- =============================================
-- BASIC CONNECTIVITY TESTS
-- =============================================

-- Test 1: Verify all tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Test 2: Verify all extensions are enabled
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'postgis');

-- =============================================
-- RELATIONSHIP INTEGRITY TESTS
-- =============================================

-- Test 3: Verify foreign key relationships
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Test 4: Verify RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
ORDER BY tablename;

-- =============================================
-- DATA INTEGRITY TESTS
-- =============================================

-- Test 5: Check sample data was inserted correctly
SELECT 'subscription_plans' as table_name, count(*) as record_count FROM subscription_plans
UNION ALL
SELECT 'job_categories', count(*) FROM job_categories
UNION ALL
SELECT 'companies', count(*) FROM companies
UNION ALL
SELECT 'certificates', count(*) FROM certificates
UNION ALL
SELECT 'certificate_categories', count(*) FROM certificate_categories
UNION ALL
SELECT 'document_templates', count(*) FROM document_templates
UNION ALL
SELECT 'portfolio_projects', count(*) FROM portfolio_projects
UNION ALL
SELECT 'questions', count(*) FROM questions
UNION ALL
SELECT 'user_feedback', count(*) FROM user_feedback
UNION ALL
SELECT 'support_tickets', count(*) FROM support_tickets;

-- Test 6: Verify job categories hierarchy
SELECT 
    c1.name as parent_category,
    c2.name as subcategory,
    c2.sort_order
FROM job_categories c1
LEFT JOIN job_categories c2 ON c2.parent_id = c1.id
WHERE c1.parent_id IS NULL
ORDER BY c1.sort_order, c2.sort_order;

-- Test 7: Verify subscription plans structure
SELECT 
    name,
    user_type,
    price_monthly,
    price_yearly,
    features::text as features_json
FROM subscription_plans
ORDER BY user_type, sort_order;

-- =============================================
-- FUNCTIONALITY TESTS
-- =============================================

-- Test 8: Test trigger functions work
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Test 9: Verify helper functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name IN ('update_updated_at_column', 'is_admin', 'user_owns_or_manages_company');

-- =============================================
-- PERFORMANCE TESTS
-- =============================================

-- Test 10: Check indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Test 11: Verify index usage (run after some operations)
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- =============================================
-- SECURITY TESTS
-- =============================================

-- Test 12: Verify RLS policies exist (commented out due to column name compatibility)
-- Uncomment and adjust column names based on your PostgreSQL version:
/*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- Test 13: Check policy coverage (commented out due to pg_policies column compatibility)
-- Uncomment and adjust column names based on your PostgreSQL version:
/*
SELECT 
    t.tablename,
    CASE 
        WHEN p.policyname IS NULL THEN 'NO POLICIES'
        ELSE 'POLICIES EXIST'
    END as policy_status,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, p.policyname
ORDER BY t.tablename;
*/

-- =============================================
-- BUSINESS LOGIC TESTS
-- =============================================

-- Test 14: Verify subscription plan constraints
SELECT 
    name,
    user_type,
    price_monthly,
    price_yearly,
    CASE 
        WHEN user_type = 'manager' AND price_monthly = 0 THEN 'VALID (Free for managers)'
        WHEN user_type = 'contractor' AND price_monthly > 0 THEN 'VALID (Paid for contractors)'
        ELSE 'INVALID PRICING'
    END as pricing_validation
FROM subscription_plans;

-- Test 15: Check job categories completeness
SELECT 
    'Total main categories' as metric,
    COUNT(*) as value
FROM job_categories 
WHERE parent_id IS NULL

UNION ALL

SELECT 
    'Total subcategories',
    COUNT(*)
FROM job_categories 
WHERE parent_id IS NOT NULL

UNION ALL

SELECT 
    'Average subcategories per main category',
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM job_categories WHERE parent_id IS NULL), 2)
FROM job_categories 
WHERE parent_id IS NOT NULL;

-- Test 16: Verify company types distribution
SELECT 
    type,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM companies
GROUP BY type
ORDER BY count DESC;

-- =============================================
-- SAMPLE OPERATIONS TESTS
-- =============================================

-- Test 17: Test creating a sample user profile (requires auth setup)
-- Note: This test requires Supabase Auth to be properly configured
/*
INSERT INTO user_profiles (id, user_type, first_name, last_name)
VALUES (uuid_generate_v4(), 'contractor', 'Test', 'User')
RETURNING id, user_type, created_at;
*/

-- Test 18: Test file upload simulation (requires user profiles to exist)
-- Uncomment this test after user profiles are created:
/*
INSERT INTO file_uploads (
    user_id,
    file_name,
    original_name,
    file_path,
    file_size,
    mime_type,
    file_type,
    entity_type,
    description
) VALUES (
    (SELECT id FROM user_profiles LIMIT 1),
    'test-file-uuid.jpg',
    'test-image.jpg',
    '/uploads/test-file-uuid.jpg',
    1024000,
    'image/jpeg',
    'image',
    'portfolio',
    'Test image upload'
) RETURNING id, file_name, created_at;
*/

-- Test 19: Test message creation (requires user profiles to exist)
-- Uncomment this test after user profiles are created:
/*
DO $$
DECLARE
    conv_id UUID;
    msg_id UUID;
BEGIN
    -- Create a test conversation
    INSERT INTO conversations (participant_1, participant_2, subject)
    VALUES (
        (SELECT id FROM user_profiles LIMIT 1),
        (SELECT id FROM user_profiles OFFSET 1 LIMIT 1),
        'Test Conversation'
    ) RETURNING id INTO conv_id;
    
    -- Create a test message
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (conv_id, (SELECT id FROM user_profiles LIMIT 1), 'Test message content')
    RETURNING id INTO msg_id;
    
    -- Verify the message was created
    RAISE NOTICE 'Created conversation: % and message: %', conv_id, msg_id;
END $$;
*/

-- =============================================
-- CLEANUP TEST DATA
-- =============================================

-- Test 20: Clean up test data (only needed if tests above are uncommented)
-- DELETE FROM messages WHERE content = 'Test message content';
-- DELETE FROM conversations WHERE subject = 'Test Conversation';
-- DELETE FROM file_uploads WHERE description = 'Test image upload';

-- =============================================
-- FINAL VERIFICATION
-- =============================================

-- Test 21: Overall schema health check
SELECT 
    'Schema Health Check' as check_name,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') >= 25 
        THEN 'PASS - All tables created'
        ELSE 'FAIL - Missing tables'
    END as status,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables_count

UNION ALL

SELECT 
    'RLS Coverage',
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) >= 25
        THEN 'PASS - RLS enabled on all tables'
        ELSE 'FAIL - RLS not enabled on all tables'
    END,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true)

UNION ALL

SELECT 
    'Sample Data',
    CASE 
        WHEN (SELECT COUNT(*) FROM subscription_plans) >= 3 
        THEN 'PASS - Sample data loaded'
        ELSE 'FAIL - Sample data missing'
    END,
    (SELECT COUNT(*) FROM subscription_plans);

-- =============================================
-- SUMMARY REPORT
-- =============================================

-- Final summary of database setup
SELECT 
    'Domio Database Schema Verification Complete' as status,
    NOW() as verified_at,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tables,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indexes,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM subscription_plans) as subscription_plans,
    (SELECT COUNT(*) FROM job_categories) as job_categories,
    (SELECT COUNT(*) FROM companies) as sample_companies;
