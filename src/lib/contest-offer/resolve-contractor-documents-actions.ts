'use server';

import { createClient } from '../supabase/server';
import type { FormalRequirements } from '../../types/tender-contest';
import type { ResolvedContractorDocument } from '../../types/contest-offer';
import { resolveContractorDocumentsWithClient } from './resolve-contractor-documents-server';

export async function resolveContractorDocuments(
  userId: string,
  formal: FormalRequirements,
): Promise<ResolvedContractorDocument[]> {
  const supabase = await createClient();
  return resolveContractorDocumentsWithClient(supabase, userId, formal);
}
