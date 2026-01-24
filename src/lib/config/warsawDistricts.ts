/**
 * Dzielnice Warszawy – oficjalna lista 18 dzielnic m.st. Warszawy.
 * Używana m.in. w formularzu rejestracji Ogłoszeniodawców (Spółdzielnia/Wspólnota).
 */
export const WARSAW_DISTRICTS = [
  'Bemowo',
  'Białołęka',
  'Bielany',
  'Mokotów',
  'Ochota',
  'Praga-Południe',
  'Praga-Północ',
  'Rembertów',
  'Śródmieście',
  'Targówek',
  'Ursus',
  'Ursynów',
  'Wawer',
  'Wesoła',
  'Wilanów',
  'Włochy',
  'Wola',
  'Żoliborz',
] as const;

export type WarsawDistrict = (typeof WARSAW_DISTRICTS)[number];

export const DEFAULT_CITY = 'Warszawa';
