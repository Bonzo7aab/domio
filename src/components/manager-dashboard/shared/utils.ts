import { createClient } from '../../../lib/supabase/client';
import type { CompanyData } from '../../../lib/database/companies';

/**
 * Map company type to Polish display name
 */
export function getCompanyTypeDisplayName(type: string | null): string {
  const typeMap: { [key: string]: string } = {
    'wspólnota': 'Wspólnota Mieszkaniowa',
    'spółdzielnia': 'Spółdzielnia Mieszkaniowa',
    'property_management': 'Firma zarządzająca nieruchomościami',
    'housing_association': 'Stowarzyszenie Mieszkaniowe',
    'cooperative': 'Spółdzielnia',
    'condo_management': 'Zarządca Nieruchomości',
  };
  return typeMap[type || ''] || 'Organizacja zarządzająca';
}

/**
 * Format full address from company data
 */
export function getCompanyAddress(company: CompanyData | null): string {
  if (!company) return '';
  const parts = [
    company.address,
    company.postal_code,
    company.city
  ].filter(Boolean);
  return parts.join(', ') || '';
}

/**
 * Get public URL for building images
 */
export function getBuildingImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Otherwise, convert storage path to public URL
  const supabase = createClient();
  const { data } = supabase.storage
    .from('building-images')
    .getPublicUrl(imagePath);
  
  return data.publicUrl;
}

/**
 * Get status badge configuration
 */
export function getStatusBadgeConfig(status: string) {
  const statusConfig = {
    active: { label: 'Aktywne', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Zakończone', variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
    pending: { label: 'Oczekujące', variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800' },
    cancelled: { label: 'Anulowane', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
  };
  
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
}
