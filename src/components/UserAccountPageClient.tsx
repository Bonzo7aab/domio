'use client'

import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { useUserProfile } from '../contexts/AuthContext';
import type { VerificationStatus } from '../lib/database/verification';
import { PasswordForm } from './PasswordForm';
import { ProfileForm } from './ProfileForm';
import { CompanyManagementForm } from './CompanyManagementForm';
import { DeleteAccountSection } from './DeleteAccountSection';
import { ContractorDocumentsTab } from './ContractorDocumentsTab';
import { needsVerificationAttention } from '../lib/verification/needs-verification-attention';
import type {
  DocumentReviewMap,
  VerificationDocumentEntry,
} from '../lib/database/admin-verification';
import { ContractorNotificationsPanel } from './ContractorNotificationsPanel';
import { UserAccountHeader } from './UserAccountHeader';
import { Tabs, TabsContent } from './ui/tabs';
import { cn } from './ui/utils';
import { VerificationAttentionIcon } from './VerificationAttentionIcon';

interface UserAccountPageClientProps {
  verificationStatus: VerificationStatus;
  verificationDocuments?: VerificationDocumentEntry[];
  documentReviews?: DocumentReviewMap;
}

export function UserAccountPageClient({
  verificationStatus,
  verificationDocuments = [],
  documentReviews,
}: UserAccountPageClientProps) {
  const { user, isLoading } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Priority 1 & 5: Controlled tabs with URL persistence
  const [activeTab, setActiveTab] = React.useState('profile');

  const ACCOUNT_TABS = [
    'profile',
    'company',
    'security',
    'contractor-data',
    'documents',
    'contractor-notifications',
  ] as const;

  const resolveTabFromUrl = React.useCallback(
    (tabFromUrl: string | null): string | null => {
      if (!tabFromUrl) return null;
      const normalizedTab =
        tabFromUrl === 'notifications' ? 'contractor-notifications' : tabFromUrl;
      if (!ACCOUNT_TABS.includes(normalizedTab as (typeof ACCOUNT_TABS)[number])) {
        return null;
      }
      if (normalizedTab === 'company') {
        return 'profile';
      }
      if (user?.userType === 'manager' && normalizedTab === 'documents') {
        return 'profile';
      }
      if (user?.userType === 'contractor' && normalizedTab === 'profile') {
        return 'contractor-data';
      }
      return normalizedTab;
    },
    [user?.userType],
  );

  // Track client-side mount to prevent hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const applyTabToUrl = React.useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const isDefaultTab =
        (user?.userType === 'contractor' && tab === 'contractor-data') ||
        (user?.userType === 'manager' && tab === 'profile');

      if (isDefaultTab) {
        params.delete('tab');
      } else {
        const urlTab = tab === 'contractor-notifications' ? 'notifications' : tab;
        params.set('tab', urlTab);
      }

      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const qs = params.toString();
      router.replace(qs ? `?${qs}${hash}` : `${window.location.pathname}${hash}`, {
        scroll: false,
      });
    },
    [router, searchParams, user?.userType],
  );

  const handleTabChange = React.useCallback(
    (tab: string) => {
      setActiveTab(tab);
      if (user) {
        applyTabToUrl(tab);
      }
    },
    [applyTabToUrl, user],
  );

  // URL → state (menu / deep links). useLayoutEffect so we apply before persist-style races.
  React.useLayoutEffect(() => {
    if (!isMounted || !user) return;
    const tabParam = searchParams.get('tab');
    const resolved = resolveTabFromUrl(tabParam);
    if (resolved) {
      setActiveTab(resolved);
      return;
    }
    if (!tabParam) {
      setActiveTab(user.userType === 'contractor' ? 'contractor-data' : 'profile');
    }
  }, [isMounted, user, searchParams, resolveTabFromUrl]);

  // Scroll to the target anchor (e.g. `#oc-policy`) once the active tab's
  // content has had a chance to render. Runs whenever the active tab changes
  // so re-clicking the OC notice on the same page keeps working.
  React.useEffect(() => {
    if (!isMounted) return;
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const id = hash.slice(1);
    const handle = window.requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return () => window.cancelAnimationFrame(handle);
  }, [activeTab, isMounted]);

  // Prevent hydration mismatch by not rendering loading state during SSR
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-sm text-muted-foreground">
            Nie udało się wczytać profilu. Odśwież stronę lub skontaktuj się z administratorem.
          </p>
        </div>
      </div>
    );
  }

  const showDocumentsTabAttention = needsVerificationAttention(user);

  return (
    <div className="min-h-screen bg-gray-50">
      <UserAccountHeader verificationStatus={verificationStatus} />

      {/* Tabs Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {user.userType === 'contractor' ? (
              <>
                <button
                  onClick={() => handleTabChange('contractor-data')}
                  className={cn(
                    'px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0',
                    activeTab === 'contractor-data'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  Twoje dane
                </button>
                <button
                  onClick={() => handleTabChange('documents')}
                  className={cn(
                    'relative px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0',
                    showDocumentsTabAttention && 'pr-7 sm:pr-4',
                    activeTab === 'documents'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  Dokumenty
                  {showDocumentsTabAttention && (
                    <span
                      className="absolute top-1 -right-0.5 sm:top-1.5 sm:right-0"
                      aria-label="Wymagana weryfikacja dokumentów"
                    >
                      <VerificationAttentionIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-50" />
                    </span>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleTabChange('profile')}
                className={cn(
                  "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                  activeTab === 'profile'
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                Twoje dane
              </button>
            )}
            <button
              onClick={() => handleTabChange('security')}
              className={cn(
                "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                activeTab === 'security'
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Bezpieczeństwo
            </button>
            <button
              onClick={() => handleTabChange('contractor-notifications')}
              className={cn(
                "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                activeTab === 'contractor-notifications'
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Zgody na powiadomienia
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsContent value="profile" className="space-y-6">
            <ProfileForm user={user} />
            {user.userType === 'manager' && <CompanyManagementForm user={user} />}
          </TabsContent>

          <TabsContent value="contractor-data" className="space-y-6">
            <ProfileForm user={user} includeBusinessData />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <ContractorDocumentsTab
              userId={user.id}
              initialStatus={verificationStatus}
              existingDocuments={verificationDocuments}
              documentReviews={documentReviews}
            />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <PasswordForm accountEmail={user.email} />
            <DeleteAccountSection />
          </TabsContent>

          <TabsContent value="contractor-notifications" className="space-y-6">
            <ContractorNotificationsPanel userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
