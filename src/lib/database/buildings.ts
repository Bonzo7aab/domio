import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { Building, BuildingFormData } from '../../types/building';

/**
 * Fetch all buildings for a company
 */
export async function fetchCompanyBuildings(
  supabase: SupabaseClient<Database>,
  companyId: string
): Promise<{ data: Building[] | null; error: PostgrestError | null }> {
  try {
      const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return { data: null, error };
    }

    return { data: data as Building[], error: null };
  } catch (err) {
    console.error('Error fetching company buildings:', err);
    return { data: null, error: err };
  }
}

/**
 * Create a new building
 */
export async function createBuilding(
  supabase: SupabaseClient<Database>,
  companyId: string,
  buildingData: BuildingFormData
): Promise<{ data: Building | null; error: PostgrestError | null }> {
  try {
    const insertData: Record<string, unknown> = {
      company_id: companyId,
      name: buildingData.name.trim(),
      street_address: buildingData.street_address.trim(),
      city: buildingData.city.trim(),
      postal_code: buildingData.postal_code?.trim() || null,
      country: 'PL',
      building_type: buildingData.building_type || null,
      year_built: buildingData.year_built ? parseInt(buildingData.year_built, 10) : null,
      units_count: buildingData.units_count ? parseInt(buildingData.units_count, 10) : null,
      floors_count: buildingData.floors_count ? parseInt(buildingData.floors_count, 10) : null,
      latitude: buildingData.latitude || null,
      longitude: buildingData.longitude || null,
      notes: buildingData.notes?.trim() || null,
      images: buildingData.images && buildingData.images.length > 0 ? buildingData.images : null,
    };

    // Validate required fields
    if (!insertData.name || !insertData.street_address || !insertData.city) {
      return { 
        data: null, 
        error: new Error('Nazwa, adres ulicy i miasto są wymagane') as PostgrestError
      };
    }

    // Validate year_built if provided
    if (insertData.year_built !== null) {
      const currentYear = new Date().getFullYear();
      const yearBuilt = Number(insertData.year_built);
      if (yearBuilt < 1800 || yearBuilt > currentYear) {
        return { 
          data: null, 
          error: new Error(`Rok budowy musi być między 1800 a ${currentYear}`) as PostgrestError
        };
      }
    }

    // Validate numeric fields
    if (insertData.units_count !== null && Number(insertData.units_count) < 0) {
      return { 
        data: null, 
        error: new Error('Liczba jednostek nie może być ujemna') as PostgrestError
      };
    }

    if (insertData.floors_count !== null && Number(insertData.floors_count) < 0) {
      return { 
        data: null, 
        error: new Error('Liczba pięter nie może być ujemna') as PostgrestError
      };
    }

      const { data, error } = await supabase
      .from('buildings')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Building, error: null };
  } catch (err) {
    console.error('Error creating building:', err);
    return { data: null, error: err };
  }
}

/**
 * Update an existing building
 */
export async function updateBuilding(
  supabase: SupabaseClient<Database>,
  buildingId: string,
  buildingData: BuildingFormData
): Promise<{ data: Building | null; error: PostgrestError | null }> {
  try {
    const updateData: Record<string, unknown> = {
      name: buildingData.name.trim(),
      street_address: buildingData.street_address.trim(),
      city: buildingData.city.trim(),
      postal_code: buildingData.postal_code?.trim() || null,
      building_type: buildingData.building_type || null,
      year_built: buildingData.year_built ? parseInt(buildingData.year_built, 10) : null,
      units_count: buildingData.units_count ? parseInt(buildingData.units_count, 10) : null,
      floors_count: buildingData.floors_count ? parseInt(buildingData.floors_count, 10) : null,
      latitude: buildingData.latitude || null,
      longitude: buildingData.longitude || null,
      notes: buildingData.notes?.trim() || null,
      images: buildingData.images && buildingData.images.length > 0 ? buildingData.images : null,
      updated_at: new Date().toISOString(),
    };

    // Validate required fields
    if (!updateData.name || !updateData.street_address || !updateData.city) {
      return { 
        data: null, 
        error: new Error('Nazwa, adres ulicy i miasto są wymagane') as PostgrestError
      };
    }

    // Validate year_built if provided
    if (updateData.year_built !== null) {
      const currentYear = new Date().getFullYear();
      const yearBuilt = Number(updateData.year_built);
      if (yearBuilt < 1800 || yearBuilt > currentYear) {
        return { 
          data: null, 
          error: new Error(`Rok budowy musi być między 1800 a ${currentYear}`) as PostgrestError
        };
      }
    }

    // Validate numeric fields
    if (updateData.units_count !== null && Number(updateData.units_count) < 0) {
      return { 
        data: null, 
        error: new Error('Liczba jednostek nie może być ujemna') as PostgrestError
      };
    }

    if (updateData.floors_count !== null && Number(updateData.floors_count) < 0) {
      return { 
        data: null, 
        error: new Error('Liczba pięter nie może być ujemna') as PostgrestError
      };
    }

      const { data, error } = await supabase
      .from('buildings')
      .update(updateData)
      .eq('id', buildingId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: data as Building, error: null };
  } catch (err) {
    console.error('Error updating building:', err);
    return { data: null, error: err };
  }
}

/**
 * Delete a building
 */
export async function deleteBuilding(
  supabase: SupabaseClient<Database>,
  buildingId: string
): Promise<{ success: boolean; error: PostgrestError | null }> {
  try {
      const { error } = await supabase
      .from('buildings')
      .delete()
      .eq('id', buildingId);

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Error deleting building:', err);
    return { success: false, error: err };
  }
}

