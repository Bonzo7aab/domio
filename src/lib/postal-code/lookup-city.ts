interface PostalCodeEntry {
  miejscowosc?: string;
}

/** Resolve city name from a Polish postal code (XX-XXX). */
export async function lookupCityByPostalCode(postalCode: string): Promise<string | null> {
  const normalized = postalCode.replace(/\s/g, '').trim();
  if (!/^\d{2}-\d{3}$/.test(normalized)) {
    return null;
  }

  try {
    const response = await fetch(`https://kodpocztowy.intami.pl/api/${normalized}`);
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as PostalCodeEntry[];
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const city = data[0].miejscowosc?.trim();
    return city || null;
  } catch {
    return null;
  }
}
