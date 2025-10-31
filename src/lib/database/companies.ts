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
    // Type assertion needed for user_companies table
    const result = await (supabase as any)
      .from('user_companies')
      .select(`
        *,
        company:companies (*)
      `)
      .eq('user_id', userId)
      .eq('is_primary', true)
      .eq('is_active', true)
      .single();
    
    const { data, error } = result;

    if (error) {
      // No primary company found is not an error
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error };
    }

    return { data: (data as any)?.company || null, error: null };
  } catch (err) {
    console.error('Error fetching user company:', err);
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
    console.error('Error fetching user companies:', err);
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
    // First, check if user already has a primary company
    const existingResult = await (supabase as any)
      .from('user_companies')
      .select('company_id, company:companies (*)')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();
    
    const { data: existingRelation } = existingResult;

    let companyId: string;

    if (existingRelation?.company_id) {
      // Update existing company
      companyId = existingRelation.company_id;
      
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
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
        } as any)
        .eq('id', companyId)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError };
      }

      return { data: updatedCompany as any, error: null };
    } else {
      // Create new company
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
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
        } as any)
        .select()
        .single();

      if (createError || !newCompany) {
        return { data: null, error: createError };
      }

      companyId = newCompany.id;

      // Create user-company relationship
      const relationResult = await (supabase as any)
        .from('user_companies')
        .insert({
          user_id: userId,
          company_id: companyId,
          role: 'owner',
          is_primary: true,
          is_active: true,
        });
      
      const { error: relationError } = relationResult;

      if (relationError) {
        return { data: null, error: relationError };
      }

      return { data: newCompany as any, error: null };
    }
  } catch (err) {
    console.error('Error upserting company:', err);
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
    console.error('Error deleting company:', err);
    return { success: false, error: err };
  }
}

