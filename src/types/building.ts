export type BuildingType = 'residential' | 'commercial' | 'mixed' | 'office' | 'industrial';

export interface Building {
  id: string;
  company_id: string;
  name: string;
  street_address: string;
  city: string;
  postal_code: string | null;
  country: string;
  building_type: BuildingType | null;
  year_built: number | null;
  units_count: number | null;
  floors_count: number | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BuildingFormData {
  name: string;
  street_address: string;
  city: string;
  postal_code: string;
  building_type: BuildingType | '';
  year_built: string;
  units_count: string;
  floors_count: string;
  notes: string;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[]; // Array of image URLs
}

export const BUILDING_TYPE_OPTIONS = [
  { value: 'residential', label: 'Mieszkaniowy' },
  { value: 'commercial', label: 'Komercyjny' },
  { value: 'mixed', label: 'Mieszany' },
  { value: 'office', label: 'Biurowy' },
  { value: 'industrial', label: 'Przemysłowy' },
] as const;

