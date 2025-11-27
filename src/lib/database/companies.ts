import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';

export interface CompanyData {
  id: string;
  name: string;
  short_name: string | null;
  type: string;
  nip: string | null;
  regon: string | null;
  krs: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  founded_year: number | null;
  employee_count: string | null;
  license_number: string | null;
  is_verified: boolean;
  verification_level: string;
  created_at: string;
  updated_at: string;
}

export interface UserCompanyRelation {
  id: string;
  user_id: string;
  company_id: string;
  role: string | null;
  is_primary: boolean;
  is_active: boolean;
  joined_at: string;
  company?: CompanyData;
}

/**
 * Fetch user's primary company
 */
export async function fetchUserPrimaryCompany(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ data: CompanyData | null; error: any }> {
  try {
    // First, get the user_companies relation
    const relationResult = await (supabase as any)
      .from('user_companies')
      .select('company_id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .eq('is_active', true)
      .maybeSingle();
    
    const { data: relation, error: relationError } = relationResult;

    if (relationError) {
      // No primary company found is not an error
      if (relationError.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error: relationError };
    }

    if (!relation || !relation.company_id) {
      return { data: null, error: null };
    }

    // Then fetch the company data
    const companyResult = await supabase
      .from('companies')
      .select('*')
      .eq('id', relation.company_id)
      .single();

    const { data: company, error: companyError } = companyResult;

    if (companyError) {
      return { data: null, error: companyError };
    }

    return { data: company as any, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetch all companies for a user
 */
export async function fetchUserCompanies(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ data: UserCompanyRelation[] | null; error: any }> {
  try {
    // Type assertion needed for user_companies table
    const result = await (supabase as any)
      .from('user_companies')
      .select(`
        *,
        company:companies (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false });
    
    const { data, error } = result;

    return { data: data as any, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Create or update company for a user
 */
export async function upsertUserCompany(
  supabase: SupabaseClient<Database>,
  userId: string,
  companyData: {
    name: string;
    type: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    nip?: string;
    description?: string;
  }
): Promise<{ data: CompanyData | null; error: any }> {
  try {
    // First, check if user already has a primary company (two-step fetch to avoid nested select issues)
    const existingResult = await (supabase as any)
      .from('user_companies')
      .select('company_id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .eq('is_active', true)
      .maybeSingle();
    
    const { data: existingRelation, error: existingError } = existingResult;

    // If error is "no rows found", that's fine - we'll create a new company
    // Only treat other errors as actual problems
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('[upsertUserCompany] Error checking for existing company:', existingError);
      return { data: null, error: existingError };
    }

    let companyId: string;

    if (existingRelation?.company_id) {
      // Update existing company
      companyId = existingRelation.company_id;
      
      const updateData = {
        name: companyData.name,
        type: companyData.type as any,
        phone: companyData.phone || null,
        email: companyData.email || null,
        address: companyData.address || null,
        city: companyData.city || null,
        postal_code: companyData.postal_code || null,
        nip: companyData.nip || null,
        description: companyData.description || null,
        updated_at: new Date().toISOString(),
      };

      console.log('[upsertUserCompany] Updating existing company:', companyId, updateData);

      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update(updateData as any)
        .eq('id', companyId)
        .select()
        .single();

      if (updateError) {
        const updateErrorDetails = updateError as any;
        console.error('[upsertUserCompany] Error updating company:', {
          error: updateError,
          message: updateErrorDetails?.message,
          details: updateErrorDetails?.details,
          hint: updateErrorDetails?.hint,
          code: updateErrorDetails?.code,
          companyId,
          updateData,
        });
        return { data: null, error: updateError };
      }

      if (!updatedCompany) {
        console.error('[upsertUserCompany] Company was not updated but no error was returned');
        return { data: null, error: new Error('Company was not updated but no error was returned') };
      }

      console.log('[upsertUserCompany] Company updated successfully:', updatedCompany.id);
      return { data: updatedCompany as any, error: null };
    } else {
      // Create new company
      const insertData = {
        name: companyData.name,
        type: companyData.type as any,
        phone: companyData.phone || null,
        email: companyData.email || null,
        address: companyData.address || null,
        city: companyData.city || null,
        postal_code: companyData.postal_code || null,
        nip: companyData.nip || null,
        description: companyData.description || null,
        country: 'PL',
        is_verified: false,
        verification_level: 'none' as any,
      };

      console.log('[upsertUserCompany] Creating new company with data:', insertData);

      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert(insertData as any)
        .select()
        .single();

      if (createError) {
        const createErrorDetails = createError as any;
        console.error('[upsertUserCompany] Error creating company:', {
          error: createError,
          message: createErrorDetails?.message,
          details: createErrorDetails?.details,
          hint: createErrorDetails?.hint,
          code: createErrorDetails?.code,
          insertData,
        });
        return { 
          data: null, 
          error: createError instanceof Error 
            ? createError 
            : new Error(createErrorDetails?.message || createErrorDetails?.details || createErrorDetails?.hint || 'Unknown database error')
        };
      }

      if (!newCompany) {
        console.error('[upsertUserCompany] Company was not created but no error was returned');
        return { data: null, error: new Error('Company was not created but no error was returned') };
      }

      console.log('[upsertUserCompany] Company created successfully:', newCompany.id);
      companyId = newCompany.id;

      // Create user-company relationship
      const relationData = {
        user_id: userId,
        company_id: companyId,
        role: 'owner',
        is_primary: true,
        is_active: true,
      };

      console.log('[upsertUserCompany] Creating user-company relationship:', relationData);

      const relationResult = await (supabase as any)
        .from('user_companies')
        .insert(relationData);
      
      const { error: relationError } = relationResult;

      if (relationError) {
        const errorDetails = relationError as any;
        console.error('[upsertUserCompany] Error creating user-company relationship:', {
          error: relationError,
          message: errorDetails?.message,
          details: errorDetails?.details,
          hint: errorDetails?.hint,
          code: errorDetails?.code,
          relationData,
        });
        return { 
          data: null, 
          error: relationError instanceof Error 
            ? relationError 
            : new Error(relationError?.message || relationError?.details || relationError?.hint || 'Failed to create user-company relationship')
        };
      }

      console.log('[upsertUserCompany] User-company relationship created successfully');

      // Verify the company was actually saved by fetching it back
      const verifyResult = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (verifyResult.error || !verifyResult.data) {
        console.error('[upsertUserCompany] Verification failed - company not found after insert:', verifyResult.error);
        return { data: null, error: new Error('Company was created but could not be verified') };
      }

      console.log('[upsertUserCompany] Company verified successfully:', verifyResult.data.id);
      return { data: verifyResult.data as any, error: null };
    }
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Delete user's company
 */
export async function deleteUserCompany(
  supabase: SupabaseClient<Database>,
  userId: string,
  companyId: string
): Promise<{ success: boolean; error: any }> {
  try {
    // First delete the relationship
    const deleteResult = await (supabase as any)
      .from('user_companies')
      .delete()
      .eq('user_id', userId)
      .eq('company_id', companyId);
    
    const { error: relationError } = deleteResult;

    if (relationError) {
      return { success: false, error: relationError };
    }

    // Check if company has other users
    const checkResult = await (supabase as any)
      .from('user_companies')
      .select('id')
      .eq('company_id', companyId)
      .limit(1);
    
    const { data: otherUsers, error: checkError } = checkResult;

    if (checkError) {
      return { success: false, error: checkError };
    }

    // If no other users, delete the company
    if (!otherUsers || otherUsers.length === 0) {
      const { error: deleteError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (deleteError) {
        return { success: false, error: deleteError };
      }
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err };
  }
}

