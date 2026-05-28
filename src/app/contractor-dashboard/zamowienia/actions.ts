'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../../../lib/supabase/server';
import { fetchUserPrimaryCompany } from '../../../lib/database/companies';
import { reportOrderForAcceptance } from '../../../lib/database/order-mutations';

const MANAGER_ORDERS_PATH = '/manager-dashboard/zamowienia';
const CONTRACTOR_ORDERS_PATH = '/contractor-dashboard/zamowienia';

export async function reportOrderForAcceptanceAction(
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!orderId?.trim()) {
    return { success: false, error: 'Nieprawidłowe dane' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Wymagane logowanie' };
  }

  const { data: company, error: companyError } = await fetchUserPrimaryCompany(
    supabase,
    user.id,
  );

  if (companyError || !company) {
    return { success: false, error: 'Brak firmy wykonawcy' };
  }

  const result = await reportOrderForAcceptance(supabase, orderId.trim(), company.id);

  if (result.success) {
    revalidatePath(MANAGER_ORDERS_PATH);
    revalidatePath(CONTRACTOR_ORDERS_PATH);
  }

  return result;
}
