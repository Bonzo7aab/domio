'use client';

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { createClient } from '../lib/supabase/client';
import { fetchContractorContestIds } from '../lib/database/contractor-contest-ids';
import { useUserProfile } from '../contexts/AuthContext';
import {
  CONTEST_BID_STATUS_CHANGED_EVENT,
  type ContestBidStatusChange,
} from '../utils/contestBidStatusEvents';

function applyContestBidStatusChange(
  change: ContestBidStatusChange,
  setSubmittedIds: Dispatch<SetStateAction<Set<string>>>,
  setDraftIds: Dispatch<SetStateAction<Set<string>>>,
): void {
  const { tenderId, status } = change;
  setSubmittedIds(prev => {
    const next = new Set(prev);
    if (status === 'submitted') next.add(tenderId);
    else next.delete(tenderId);
    return next;
  });
  setDraftIds(prev => {
    const next = new Set(prev);
    if (status === 'draft') next.add(tenderId);
    else next.delete(tenderId);
    return next;
  });
}

export function useContractorContestBidStatus() {
  const { user } = useUserProfile();
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(() => new Set());
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());
  const [isLoading, setIsLoading] = useState(false);

  const refreshBidStatus = useCallback(async () => {
    if (!user?.id || user.userType !== 'contractor') {
      setSubmittedIds(new Set());
      setDraftIds(new Set());
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { submittedContestIds, draftContestIds } = await fetchContractorContestIds(
        supabase,
        user.id,
      );
      setSubmittedIds(new Set(submittedContestIds));
      setDraftIds(new Set(draftContestIds));
    } catch {
      setSubmittedIds(new Set());
      setDraftIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.userType]);

  useEffect(() => {
    if (!user?.id || user.userType !== 'contractor') {
      queueMicrotask(() => {
        setSubmittedIds(new Set());
        setDraftIds(new Set());
        setIsLoading(false);
      });
      return;
    }

    void refreshBidStatus();
  }, [user?.id, user?.userType, refreshBidStatus]);

  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const change = (event as CustomEvent<ContestBidStatusChange>).detail;
      if (!change?.tenderId) return;
      applyContestBidStatusChange(change, setSubmittedIds, setDraftIds);

      if (!user?.id || user.userType !== 'contractor') return;
      void (async () => {
        try {
          const supabase = createClient();
          const { submittedContestIds, draftContestIds } = await fetchContractorContestIds(
            supabase,
            user.id,
          );
          setSubmittedIds(new Set(submittedContestIds));
          setDraftIds(new Set(draftContestIds));
        } catch {
          // Keep optimistic state on reconcile failure.
        }
      })();
    };

    window.addEventListener(CONTEST_BID_STATUS_CHANGED_EVENT, handleStatusChange);
    return () => {
      window.removeEventListener(CONTEST_BID_STATUS_CHANGED_EVENT, handleStatusChange);
    };
  }, [user?.id, user?.userType]);

  return { submittedIds, draftIds, isLoading };
}
