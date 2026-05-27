'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { fetchContractorBidTenderIds } from '../lib/database/contractor-bid-tender-ids';
import { useUserProfile } from '../contexts/AuthContext';

export function useContractorContestBidStatus() {
  const { user } = useUserProfile();
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(() => new Set());
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || user.userType !== 'contractor') {
      queueMicrotask(() => {
        setSubmittedIds(new Set());
        setDraftIds(new Set());
        setIsLoading(false);
      });
      return;
    }

    let cancelled = false;

    queueMicrotask(() => setIsLoading(true));

    void (async () => {
      try {
        const supabase = createClient();
        const { submittedTenderIds, draftTenderIds } = await fetchContractorBidTenderIds(
          supabase,
          user.id,
        );
        if (cancelled) return;
        setSubmittedIds(new Set(submittedTenderIds));
        setDraftIds(new Set(draftTenderIds));
      } catch {
        if (!cancelled) {
          setSubmittedIds(new Set());
          setDraftIds(new Set());
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.userType]);

  return { submittedIds, draftIds, isLoading };
}
