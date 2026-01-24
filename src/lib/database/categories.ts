import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { PostgrestError } from '@supabase/supabase-js';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

/**
 * Fetch all active main categories (categories without parent_id)
 */
export async function fetchAllCategories(
  supabase: SupabaseClient<Database>
): Promise<{ data: Category[] | null; error: PostgrestError | null }> {
  try {
    const { data, error } = await supabase
      .from('job_categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    return { data: data as Category[] | null, error };
  } catch (error) {
    return { data: null, error: error as PostgrestError };
  }
}

/**
 * Fetch a category with all its subcategories
 */
export async function fetchCategoryWithSubcategories(
  supabase: SupabaseClient<Database>,
  categoryId: string
): Promise<{ data: CategoryWithSubcategories | null; error: PostgrestError | null }> {
  try {
    // Fetch the main category
    const { data: category, error: categoryError } = await supabase
      .from('job_categories')
      .select('*')
      .eq('id', categoryId)
      .eq('is_active', true)
      .maybeSingle();

    if (categoryError || !category) {
      return { data: null, error: categoryError };
    }

    // Fetch subcategories
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('job_categories')
      .select('*')
      .eq('parent_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (subcategoriesError) {
      return { data: null, error: subcategoriesError };
    }

    return {
      data: {
        ...(category as Category),
        subcategories: (subcategories || []) as Category[]
      },
      error: null
    };
  } catch (error) {
    return { data: null, error: error as PostgrestError };
  }
}

/**
 * Fetch subcategories by parent category ID
 */
export async function fetchSubcategoriesByParentId(
  supabase: SupabaseClient<Database>,
  parentId: string
): Promise<{ data: Category[] | null; error: PostgrestError | null }> {
  try {
    const { data, error } = await supabase
      .from('job_categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    return { data: data as Category[] | null, error };
  } catch (error) {
    return { data: null, error: error as PostgrestError };
  }
}

/**
 * Fetch category by slug
 */
export async function fetchCategoryBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<{ data: Category | null; error: PostgrestError | null }> {
  try {
    const { data, error } = await supabase
      .from('job_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    return { data: data as Category | null, error };
  } catch (error) {
    return { data: null, error: error as PostgrestError };
  }
}

/**
 * Fetch all categories with their subcategories (hierarchical structure)
 */
export async function fetchAllCategoriesWithSubcategories(
  supabase: SupabaseClient<Database>
): Promise<{ data: CategoryWithSubcategories[] | null; error: PostgrestError | null }> {
  try {
    // Fetch all main categories
    const { data: mainCategories, error: mainError } = await fetchAllCategories(supabase);

    if (mainError || !mainCategories) {
      return { data: null, error: mainError };
    }

    // Fetch subcategories for each main category
    const categoriesWithSubcategories: CategoryWithSubcategories[] = [];

    for (const category of mainCategories) {
      const { data: subcategories, error: subError } = await fetchSubcategoriesByParentId(
        supabase,
        category.id
      );

      if (subError) {
        return { data: null, error: subError };
      }

      categoriesWithSubcategories.push({
        ...category,
        subcategories: subcategories || []
      });
    }

    return { data: categoriesWithSubcategories, error: null };
  } catch (error) {
    return { data: null, error: error as PostgrestError };
  }
}
