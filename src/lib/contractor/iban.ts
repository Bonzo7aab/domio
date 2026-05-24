/** Strip spaces and optional PL prefix; return digits only. */
export function normalizeIbanInput(value: string): string {
  return value.replace(/\s/g, '').replace(/^PL/i, '').replace(/\D/g, '');
}

export function isValidPolishIban(value: string): boolean {
  const digits = normalizeIbanInput(value);
  return digits.length === 26;
}

export function formatIbanDisplay(value: string): string {
  const digits = normalizeIbanInput(value);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}
