import { 
  Hammer, 
  Sparkles, 
  TreePine, 
  Zap, 
  ClipboardCheck, 
  FileText,
  type LucideIcon 
} from 'lucide-react';

export interface CategoryConfig {
  slug: string;
  name: string;
  color: string;
  icon: LucideIcon;
  description: string;
}

export const categoryConfigs: Record<string, CategoryConfig> = {
  'roboty-budowlane-remonty': {
    slug: 'roboty-budowlane-remonty',
    name: 'Roboty Budowlane i Remonty',
    color: '#1e3a8a', // granatowy
    icon: Hammer,
    description: 'Remonty dachów, termomodernizacja, renowacja, wymiana stolarki'
  },
  'sprzatanie-utrzymanie-czystosci': {
    slug: 'sprzatanie-utrzymanie-czystosci',
    name: 'Sprzątanie i Utrzymanie Czystości',
    color: '#10b981', // miętowy
    icon: Sparkles,
    description: 'Sprzątanie nieruchomości, mycie okien, DDD'
  },
  'zielen-tereny-zewnetrzne': {
    slug: 'zielen-tereny-zewnetrzne',
    name: 'Zieleń i Tereny Zewnętrzne',
    color: '#22c55e', // soczysta zieleń
    icon: TreePine,
    description: 'Pielęgnacja zieleni, brukarstwo, mała architektura, odśnieżanie'
  },
  'instalacje-systemy-techniczne': {
    slug: 'instalacje-systemy-techniczne',
    name: 'Instalacje i Systemy Techniczne',
    color: '#3b82f6', // niebieski
    icon: Zap,
    description: 'Instalacje wodno-kanalizacyjne, elektryczne, windy, systemy bezpieczeństwa'
  },
  'przeglady-obsługa-techniczna': {
    slug: 'przeglady-obsługa-techniczna',
    name: 'Przeglądy i Obsługa Techniczna',
    color: '#f97316', // pomarańczowy
    icon: ClipboardCheck,
    description: 'Przeglądy techniczne, inspekcje, serwis urządzeń'
  },
  'ekspertyzy-projekty': {
    slug: 'ekspertyzy-projekty',
    name: 'Ekspertyzy i Projekty',
    color: '#8b5cf6', // fioletowy
    icon: FileText,
    description: 'Audyty energetyczne, projekty budowlane, nadzór inwestorski'
  }
};

/**
 * Get category configuration by slug
 */
export function getCategoryConfig(slug: string): CategoryConfig | undefined {
  return categoryConfigs[slug];
}

/**
 * Get category color by slug
 */
export function getCategoryColor(slug: string): string {
  return categoryConfigs[slug]?.color || '#6b7280';
}

/**
 * Get category icon by slug
 */
export function getCategoryIcon(slug: string): LucideIcon {
  return categoryConfigs[slug]?.icon || FileText;
}

/**
 * Get all main category configs in sort order
 */
export function getAllCategoryConfigs(): CategoryConfig[] {
  return Object.values(categoryConfigs).sort((a, b) => {
    const order = [
      'roboty-budowlane-remonty',
      'sprzatanie-utrzymanie-czystosci',
      'zielen-tereny-zewnetrzne',
      'instalacje-systemy-techniczne',
      'przeglady-obsługa-techniczna',
      'ekspertyzy-projekty'
    ];
    return order.indexOf(a.slug) - order.indexOf(b.slug);
  });
}
