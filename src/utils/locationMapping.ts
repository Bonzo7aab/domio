/**
 * City to Province (Województwo) mapping for Poland
 * Maps major Polish cities to their provinces
 */

export const cityToProvinceMap: Record<string, string> = {
  // Mazowieckie
  'Warszawa': 'Mazowieckie',
  'Radom': 'Mazowieckie',
  'Płock': 'Mazowieckie',
  'Siedlce': 'Mazowieckie',
  'Ostrołęka': 'Mazowieckie',
  
  // Małopolskie
  'Kraków': 'Małopolskie',
  'Tarnów': 'Małopolskie',
  'Nowy Sącz': 'Małopolskie',
  'Oświęcim': 'Małopolskie',
  
  // Śląskie
  'Katowice': 'Śląskie',
  'Gliwice': 'Śląskie',
  'Zabrze': 'Śląskie',
  'Bytom': 'Śląskie',
  'Ruda Śląska': 'Śląskie',
  'Rybnik': 'Śląskie',
  'Tychy': 'Śląskie',
  'Dąbrowa Górnicza': 'Śląskie',
  'Sosnowiec': 'Śląskie',
  'Jaworzno': 'Śląskie',
  'Chorzów': 'Śląskie',
  'Bielsko-Biała': 'Śląskie',
  
  // Wielkopolskie
  'Poznań': 'Wielkopolskie',
  'Kalisz': 'Wielkopolskie',
  'Konin': 'Wielkopolskie',
  'Piła': 'Wielkopolskie',
  'Ostrów Wielkopolski': 'Wielkopolskie',
  
  // Dolnośląskie
  'Wrocław': 'Dolnośląskie',
  'Wałbrzych': 'Dolnośląskie',
  'Legnica': 'Dolnośląskie',
  'Jelenia Góra': 'Dolnośląskie',
  'Lubin': 'Dolnośląskie',
  
  // Łódzkie
  'Łódź': 'Łódzkie',
  'Pabianice': 'Łódzkie',
  'Tomaszów Mazowiecki': 'Łódzkie',
  'Bełchatów': 'Łódzkie',
  
  // Pomorskie
  'Gdańsk': 'Pomorskie',
  'Gdynia': 'Pomorskie',
  'Sopot': 'Pomorskie',
  'Słupsk': 'Pomorskie',
  'Tczew': 'Pomorskie',
  
  // Zachodniopomorskie
  'Szczecin': 'Zachodniopomorskie',
  'Koszalin': 'Zachodniopomorskie',
  'Stargard': 'Zachodniopomorskie',
  
  // Lubelskie
  'Lublin': 'Lubelskie',
  'Chełm': 'Lubelskie',
  'Zamość': 'Lubelskie',
  'Biała Podlaska': 'Lubelskie',
  
  // Podkarpackie
  'Rzeszów': 'Podkarpackie',
  'Przemyśl': 'Podkarpackie',
  'Stalowa Wola': 'Podkarpackie',
  'Mielec': 'Podkarpackie',
  
  // Podlaskie
  'Białystok': 'Podlaskie',
  'Suwałki': 'Podlaskie',
  'Łomża': 'Podlaskie',
  
  // Świętokrzyskie
  'Kielce': 'Świętokrzyskie',
  'Ostrowiec Świętokrzyski': 'Świętokrzyskie',
  
  // Warmińsko-Mazurskie
  'Olsztyn': 'Warmińsko-Mazurskie',
  'Elbląg': 'Warmińsko-Mazurskie',
  'Ełk': 'Warmińsko-Mazurskie',
  
  // Kujawsko-Pomorskie
  'Bydgoszcz': 'Kujawsko-Pomorskie',
  'Toruń': 'Kujawsko-Pomorskie',
  'Włocławek': 'Kujawsko-Pomorskie',
  'Grudziądz': 'Kujawsko-Pomorskie',
  
  // Lubuskie
  'Zielona Góra': 'Lubuskie',
  'Gorzów Wielkopolski': 'Lubuskie',
  
  // Opolskie
  'Opole': 'Opolskie',
  'Kędzierzyn-Koźle': 'Opolskie',
  
  // Podkarpackie (additional)
  'Jarosław': 'Podkarpackie',
  'Krosno': 'Podkarpackie',
};

/**
 * Location can be either:
 * - A string: "Warszawa" or "Warszawa, Mazowieckie"
 * - An object: { city: "Warszawa", sublocality_level_1?: "Ursynów" }
 */
export interface LocationData {
  city: string;
  sublocality_level_1?: string;
}

/**
 * Extract city name from location (string or object)
 * Handles formats like "Warszawa", "Warszawa, Mazowieckie", or { city: "Warszawa", sublocality_level_1: "Ursynów" }
 */
export function extractCity(location: string | LocationData): string {
  if (!location) return '';
  
  // If location is an object
  if (typeof location === 'object' && location !== null && 'city' in location) {
    return location.city || '';
  }
  
  // If location is a string
  if (typeof location === 'string') {
    // If location contains comma, take the first part (city)
    const parts = location.split(',').map(p => p.trim());
    return parts[0] || location;
  }
  
  return '';
}

/**
 * Extract sublocality_level_1 from location (string or object)
 */
export function extractSublocality(location: string | LocationData): string | null {
  if (!location) return null;
  
  // If location is an object
  if (typeof location === 'object' && location !== null && 'sublocality_level_1' in location) {
    return location.sublocality_level_1 || null;
  }
  
  return null;
}

/**
 * Get province for a given city
 */
export function getProvinceForCity(city: string): string | null {
  const normalizedCity = city.trim();
  return cityToProvinceMap[normalizedCity] || null;
}

/**
 * Get all unique provinces from a list of cities
 */
export function getProvincesFromCities(cities: string[]): string[] {
  const provinces = new Set<string>();
  cities.forEach(city => {
    const province = getProvinceForCity(city);
    if (province) {
      provinces.add(province);
    }
  });
  return Array.from(provinces).sort();
}

