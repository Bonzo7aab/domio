'use server';

import { createClient } from '../supabase/server';
import { fetchUserPrimaryCompany } from '../database/companies';
import { normalizeIbanInput, isValidPolishIban } from '../contractor/iban';
import { normalizeNip } from '../gus/nip';
import { checkBankAccountOnVatWhitelist } from './check-bank-account';
import type { VerifyContractorBankAccountResult } from './types';

async function persistVatWhitelistVerification(
  userId: string,
  bankAccount: string,
  result: Awaited<ReturnType<typeof checkBankAccountOnVatWhitelist>>,
): Promise<void> {
  const supabase = await createClient();
  const verifiedAt = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const patch = {
    bank_account_iban: bankAccount,
    vat_whitelist_verified_at: verifiedAt,
    vat_whitelist_account_assigned: result.assigned,
    vat_whitelist_request_id: result.requestId,
    vat_whitelist_checked_for_date: result.checkedForDate,
    updated_at: verifiedAt,
  };

  const { data: existing } = await client
    .from('contractor_account_settings')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await client.from('contractor_account_settings').update(patch).eq('user_id', userId);
    if (error) {
      console.error('persistVatWhitelistVerification update failed:', error);
    }
    return;
  }

  const { error } = await client.from('contractor_account_settings').insert({
    user_id: userId,
    notification_channels: { email: true, app: true, phoneCall: false, sms: false },
    radar_settings: { enabled: true, minAmountNet: 1000, areas: ['Warszawa'] },
    ...patch,
  });

  if (error) {
    console.error('persistVatWhitelistVerification insert failed:', error);
  }
}

export async function verifyContractorBankAccountAction(
  bankAccountInput: string,
): Promise<VerifyContractorBankAccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Musisz być zalogowany' };
  }

  const bankAccount = normalizeIbanInput(bankAccountInput);
  if (!bankAccount) {
    return { error: 'Podaj numer konta bankowego' };
  }

  if (!isValidPolishIban(bankAccount)) {
    return { error: 'Numer konta bankowego musi składać się z 26 cyfr' };
  }

  const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
  if (companyError) {
    console.error('verifyContractorBankAccountAction company lookup failed:', companyError);
    return { error: 'Nie udało się pobrać danych firmy' };
  }

  const nip = company?.nip ? normalizeNip(company.nip) : '';
  if (!nip) {
    return { error: 'Uzupełnij NIP firmy w profilu, aby zweryfikować konto na białej liście VAT' };
  }

  try {
    const result = await checkBankAccountOnVatWhitelist(nip, bankAccount);
    await persistVatWhitelistVerification(user.id, bankAccount, result);
    return { data: result };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_NIP') {
        return { error: 'Nieprawidłowy NIP firmy — popraw dane w profilu' };
      }
      if (error.message === 'INVALID_BANK_ACCOUNT') {
        return { error: 'Nieprawidłowy numer konta bankowego' };
      }
      if (error.message.startsWith('MF_API_HTTP_')) {
        return { error: 'Usługa weryfikacji MF jest tymczasowo niedostępna. Spróbuj ponownie później.' };
      }
    }

    console.error('verifyContractorBankAccountAction failed:', error);
    return { error: 'Nie udało się zweryfikować konta na białej liście VAT' };
  }
}
