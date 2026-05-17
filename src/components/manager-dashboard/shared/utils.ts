import { createClient } from '../../../lib/supabase/client';
import type { CompanyData } from '../../../lib/database/companies';
import { getJobWorkflowStatusLabel } from '../../../lib/job-workflow-status';

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
  const label = getJobWorkflowStatusLabel(status);
  const colorByStatus: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800',
    collecting_offers: 'bg-blue-100 text-blue-800',
    active: 'bg-blue-100 text-blue-800',
    selecting_offer: 'bg-amber-100 text-amber-900',
    in_progress: 'bg-violet-100 text-violet-900',
    ready_for_acceptance: 'bg-orange-100 text-orange-900',
    completed: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-gray-100 text-gray-800',
    inactive: 'bg-gray-100 text-gray-600',
  };

  const normalized =
    status === 'active' ? 'collecting_offers' : status;

  return {
    label,
    variant: 'default' as const,
    color: colorByStatus[normalized] || colorByStatus[status] || 'bg-yellow-100 text-yellow-800',
  };
}
