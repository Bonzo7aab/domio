import type { ContractorProfile } from '../../../lib/database/contractors';

/**
 * Format contractor address from profile data
 */
export function getContractorAddress(profile: ContractorProfile | null): string {
  if (!profile?.contactInfo?.address) return '';
  
  const parts = [profile.contactInfo.address];
  
  // Add city from location if available
  if (profile.location?.city) {
    parts.push(profile.location.city);
  }
  
  return parts.filter(Boolean).join(', ') || '';
}

/**
 * Get status badge configuration for contractor applications
 */
export function getApplicationStatusBadgeConfig(status: string) {
  const statusConfig = {
    submitted: { label: 'Wysłana', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
    under_review: { label: 'W ocenie', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: 'Zaakceptowana', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Odrzucona', variant: 'outline' as const, color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Anulowana', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' }
  };
  
  return statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
}

/**
 * Translate category names to Polish
 */
export function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    // Contractor categories
    'quality': 'Jakość wykonania',
    'timeliness': 'Terminowość',
    'communication': 'Komunikacja',
    'pricing': 'Cena',
    // Manager categories
    'payment_timeliness': 'Terminowość płatności',
    'project_clarity': 'Przejrzystość projektu',
    'professionalism': 'Profesjonalizm',
  };
  return categoryMap[category.toLowerCase()] || category;
}

/**
 * Format time ago in Polish
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const past = date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Przed chwilą';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minutę' : minutes < 5 ? 'minuty' : 'minut'} temu`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'godzinę' : hours < 5 ? 'godziny' : 'godzin'} temu`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    if (days === 1) return 'wczoraj';
    return `${days} ${days < 5 ? 'dni' : 'dni'} temu`;
  }
  return past.toLocaleDateString('pl-PL');
}

