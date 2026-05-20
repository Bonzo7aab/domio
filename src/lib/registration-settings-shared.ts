/** Client-safe types and copy for registration hold settings (no server imports). */

export interface RegistrationSettings {
  contractorOpen: boolean;
  managerOpen: boolean;
}

export const DEFAULT_REGISTRATION_SETTINGS: RegistrationSettings = {
  contractorOpen: true,
  managerOpen: true,
};

export function registrationClosedMessage(userType: 'contractor' | 'manager'): string {
  return userType === 'contractor'
    ? 'Rejestracja wykonawców jest tymczasowo wstrzymana. Spróbuj ponownie później.'
    : 'Rejestracja zarządców jest tymczasowo wstrzymana. Spróbuj ponownie później.';
}
