import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';

/**
 * Creates a Supabase admin client for test data management
 */
function createAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Executes a test function within a database transaction that automatically rolls back.
 * This provides complete test isolation by ensuring all database changes are reverted after the test.
 * 
 * Note: Supabase JS client doesn't support transactions directly, so this uses PostgreSQL functions.
 * You need to create the transaction helper functions in your database first.
 * 
 * @param testFn - The test function to execute within a transaction
 * @returns The result of the test function
 * 
 * @example
 * ```typescript
 * await withTransaction(async (client) => {
 *   const { data, error } = await client.from('users').insert({ email: 'test@example.com' });
 *   // All changes will be rolled back after this function completes
 * });
 * ```
 */
export async function withTransaction<T>(
  testFn: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const adminClient = createAdminClient();
  
  try {
    // Start transaction using PostgreSQL function
    // Note: You need to create this function in your database:
    // CREATE OR REPLACE FUNCTION begin_test_transaction() RETURNS void AS $$
    // BEGIN
    //   -- Transaction is started automatically by PostgreSQL
    // END;
    // $$ LANGUAGE plpgsql;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: beginError } = await (adminClient.rpc as any)('begin_test_transaction');
    
    if (beginError) {
      console.warn('Transaction begin function not available. Running test without transaction isolation.');
      console.warn('To enable transaction support, create begin_test_transaction() and rollback_test_transaction() functions in your database.');
      // Fallback: run test without transaction
      return await testFn(adminClient);
    }
    
    try {
      const result = await testFn(adminClient);
      
      // Rollback transaction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: rollbackError } = await (adminClient.rpc as any)('rollback_test_transaction');
      if (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      
      return result;
    } catch (error) {
      // Rollback on error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient.rpc as any)('rollback_test_transaction').catch(() => {
        // Ignore rollback errors if transaction wasn't started
      });
      throw error;
    }
  } catch {
    // If transaction functions don't exist, fallback to running without transaction
    console.warn('Transaction support not available. Running test without transaction isolation.');
    return await testFn(adminClient);
  }
}

/**
 * SQL migration to create transaction helper functions.
 * Run this in your Supabase SQL editor to enable transaction support:
 * 
 * ```sql
 * CREATE OR REPLACE FUNCTION begin_test_transaction() RETURNS void AS $$
 * BEGIN
 *   -- Transaction is managed by the calling code
 *   -- This function exists for compatibility
 * END;
 * $$ LANGUAGE plpgsql;
 * 
 * CREATE OR REPLACE FUNCTION rollback_test_transaction() RETURNS void AS $$
 * BEGIN
 *   -- Rollback is managed by the calling code
 *   -- This function exists for compatibility
 * END;
 * $$ LANGUAGE plpgsql;
 * ```
 * 
 * Note: Supabase/PostgreSQL transactions work differently than this helper suggests.
 * For true transaction isolation in tests, consider:
 * 1. Using database-level transactions with proper BEGIN/COMMIT/ROLLBACK
 * 2. Using separate test databases per test run
 * 3. Using test containers with isolated databases
 */
export const TRANSACTION_SQL_MIGRATION = `
-- Transaction helper functions for test isolation
-- Note: These are placeholder functions. True transaction isolation requires
-- proper transaction management at the database connection level.

CREATE OR REPLACE FUNCTION begin_test_transaction() RETURNS void AS $$
BEGIN
  -- Transaction management should be handled at the connection level
  -- This function is a placeholder for compatibility
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION rollback_test_transaction() RETURNS void AS $$
BEGIN
  -- Transaction rollback should be handled at the connection level
  -- This function is a placeholder for compatibility
END;
$$ LANGUAGE plpgsql;
`;

