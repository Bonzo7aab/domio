export const COOKIE_CONSENT_KEY = 'cookie-consent';

export const COOKIE_SETTINGS_EVENT = 'vestiqo:open-cookie-settings';

export function openCookieSettings(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
}
