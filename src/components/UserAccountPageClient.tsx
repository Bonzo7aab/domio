'use client'

import {
  CalendarClock,
  ChevronRight,
  Clock,
  FileWarning,
  Shield,
  ShieldCheck,
  ShieldX,
  Upload,
  User,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { useUserProfile } from '../contexts/AuthContext';
import type { VerificationStatus } from '../lib/database/verification';
import { PasswordForm } from './PasswordForm';
import { ProfileForm } from './ProfileForm';
import { CompanyManagementForm } from './CompanyManagementForm';
import { DeleteAccountSection } from './DeleteAccountSection';
import { ContractorInsuranceSettings } from './ContractorInsuranceSettings';
import { ContractorProfessionalQualificationsSettings } from './ContractorProfessionalQualificationsSettings';
import { ContractorNotificationsPanel } from './ContractorNotificationsPanel';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Tabs, TabsContent } from './ui/tabs';
import { cn } from './ui/utils';

type OcState = 'missing' | 'no-date' | 'expired' | 'expiring' | 'valid';

interface OcSnapshot {
  state: OcState;
  validUntilLabel: string | null;
  daysLeft: number | null;
}

const OC_EXPIRING_THRESHOLD_DAYS = 30;

/**
 * User-facing classification of the contractor's OC policy. We distinguish
 * "no scan" (`missing`) from "scan uploaded but no/invalid validity date"
 * (`no-date`) so the notice doesn't claim "Brak polisy OC" when a file is
 * actually attached.
 */
function classifyOcForUser(ocValidUntil: string | null, hasOcScan: boolean): OcSnapshot {
  if (!hasOcScan) {
    return { state: 'missing', validUntilLabel: null, daysLeft: null };
  }
  if (!ocValidUntil) {
    return { state: 'no-date', validUntilLabel: null, daysLeft: null };
  }
  const validUntilMs = Date.parse(ocValidUntil);
  if (!Number.isFinite(validUntilMs)) {
    return { state: 'no-date', validUntilLabel: ocValidUntil, daysLeft: null };
  }
  const validUntilLabel = new Date(validUntilMs).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const daysLeft = Math.ceil((validUntilMs - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return { state: 'expired', validUntilLabel, daysLeft };
  if (daysLeft <= OC_EXPIRING_THRESHOLD_DAYS)
    return { state: 'expiring', validUntilLabel, daysLeft };
  return { state: 'valid', validUntilLabel, daysLeft };
}

interface OcPolicyNoticeProps {
  ocOnboarding: OcOnboarding;
  onAction: () => void;
}

/**
 * Mirrors `VerificationNotice` styling so the two onboarding tasks read as a
 * cohesive set. Hidden entirely when OC is in good shape so we don't clutter
 * the header with a "you're fine" message that wastes space; we leave a tiny
 * confirmation strip instead.
 */
function OcPolicyNotice({ ocOnboarding, onAction }: OcPolicyNoticeProps) {
  const oc = classifyOcForUser(ocOnboarding.ocValidUntil, ocOnboarding.hasOcScan);

  if (oc.state === 'valid') {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-emerald-700">Polisa OC dołączona</div>
          <p className="text-xs text-muted-foreground">
            Polisa ważna do {oc.validUntilLabel} · pozostało {oc.daysLeft} dni.
          </p>
        </div>
      </div>
    );
  }

  if (oc.state === 'expiring') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <Clock className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-amber-800">Polisa OC wkrótce wygasa</div>
          <p className="text-xs text-muted-foreground">
            Wygasa {oc.validUntilLabel} ({oc.daysLeft} dni). Zaktualizuj dane, aby Twoje oferty
            pozostały widoczne.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="border-amber-500/40 text-amber-800 hover:bg-amber-500/10"
        >
          <CalendarClock className="mr-1 h-3.5 w-3.5" /> Zaktualizuj OC
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  if (oc.state === 'expired') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-lg border-2 border-destructive/40 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
          <ShieldX className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-destructive">Polisa OC wygasła</div>
          <p className="text-xs text-muted-foreground">
            Wygasła {oc.validUntilLabel}. Twoje oferty mogą zostać zawieszone — wgraj aktualną
            polisę i ustaw nową datę ważności.
          </p>
        </div>
        <Button variant="destructive" size="sm" onClick={onAction}>
          <Upload className="mr-1 h-3.5 w-3.5" /> Zaktualizuj OC
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  if (oc.state === 'no-date') {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <CalendarClock className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-amber-800">Uzupełnij datę ważności OC</div>
          <p className="text-xs text-muted-foreground">
            Skan polisy OC jest dołączony, ale brakuje daty ważności. Uzupełnij ją, aby Twoje
            oferty mogły być publikowane.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="border-amber-500/40 text-amber-800 hover:bg-amber-500/10"
        >
          <CalendarClock className="mr-1 h-3.5 w-3.5" /> Dodaj datę
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border-2 border-destructive/40 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
        <FileWarning className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-destructive">Brak polisy OC</div>
        <p className="text-xs text-muted-foreground">
          Dodaj skan polisy OC oraz datę ważności w ustawieniach konta wykonawcy. Bez polisy nie
          możemy przeprowadzić weryfikacji ani opublikować Twoich ofert.
        </p>
      </div>
      <Button size="sm" onClick={onAction}>
        <Upload className="mr-1 h-3.5 w-3.5" /> Dodaj polisę OC
        <ChevronRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface VerificationNoticeProps {
  status: VerificationStatus;
  onAction: () => void;
}

/**
 * Unified verification status notice rendered above the account tabs. Each
 * state has a distinct color/icon palette plus an inline CTA so the user
 * always sees one cohesive box rather than a mix of inline badges, separate
 * buttons, and an alert.
 */
function VerificationNotice({ status, onAction }: VerificationNoticeProps) {
  if (status.state === 'approved') {
    return (
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-emerald-700">Konto zweryfikowane</div>
          <p className="text-xs text-muted-foreground">
            Twoja firma posiada oznaczenie „Zweryfikowany”.
          </p>
        </div>
      </div>
    );
  }

  if (status.state === 'pending') {
    return (
      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 sm:flex-row sm:items-center">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
          <Clock className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-blue-700">Weryfikacja w toku</div>
          <p className="text-xs text-muted-foreground">
            Sprawdzimy Twoje dokumenty w 1–3 dni robocze. Powiadomimy Cię o wyniku.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAction}
          className="border-blue-500/40 text-blue-700 hover:bg-blue-500/10"
        >
          Sprawdź status
          <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  if (status.state === 'rejected') {
    return (
      <div className="mt-4 space-y-3 rounded-lg border-2 border-destructive/40 bg-destructive/5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <ShieldX className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="font-semibold text-destructive">Weryfikacja odrzucona</div>
            <p className="text-xs text-muted-foreground">
              Popraw wskazane elementy i prześlij dokumenty ponownie.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={onAction}>
            Prześlij ponownie
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        {status.reason && (
          <div className="rounded-md border border-destructive/30 bg-background p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-destructive">
              Powód odrzucenia
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-foreground">{status.reason}</p>
          </div>
        )}
      </div>
    );
  }

  // unsubmitted
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-center">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
        <Shield className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-amber-800">Konto wymaga weryfikacji</div>
        <p className="text-xs text-muted-foreground">
          Zweryfikowane konto otrzymuje więcej zgłoszeń i wyższą pozycję w wynikach wyszukiwania.
          Proces jest bezpłatny i zajmuje 1–3 dni robocze.
        </p>
      </div>
      <Button size="sm" onClick={onAction}>
        Zweryfikuj konto
        <ChevronRight className="ml-1 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface OcOnboarding {
  ocValidUntil: string | null;
  hasOcScan: boolean;
}

interface UserAccountPageClientProps {
  verificationStatus: VerificationStatus;
  /**
   * Contractor-only OC policy snapshot. `null` for managers (who do not have
   * an OC requirement) so the notice block is skipped entirely.
   */
  ocOnboarding: OcOnboarding | null;
}

export function UserAccountPageClient({
  verificationStatus,
  ocOnboarding,
}: UserAccountPageClientProps) {
  const { user, isLoading, session } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasCheckedAuth = React.useRef(false);
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Priority 1 & 5: Controlled tabs with URL persistence
  const [activeTab, setActiveTab] = React.useState('profile');

  const hasInitializedTabFromUrl = React.useRef(false);

  // Track client-side mount to prevent hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
    
    // Priority 5: Initialize tab from URL on mount (only once)
    if (!hasInitializedTabFromUrl.current) {
      const tabFromUrl = searchParams.get('tab');
      const normalizedTab =
        tabFromUrl === 'notifications' ? 'contractor-notifications' : tabFromUrl;
      if (
        normalizedTab &&
        ['profile', 'company', 'security', 'contractor-data', 'contractor-notifications'].includes(
          normalizedTab,
        )
      ) {
        // Managers no longer use a separate „Dane firmy” tab — deep links still work.
        setActiveTab(normalizedTab === 'company' ? 'profile' : normalizedTab);
      }
      hasInitializedTabFromUrl.current = true;
    }
  }, [searchParams]);

  // Priority 5: Persist tab state in URL
  React.useEffect(() => {
    if (!isMounted || !hasInitializedTabFromUrl.current) return;
    
    const currentTab = searchParams.get('tab') || 'profile';
    if (currentTab === activeTab) return; // No change needed
    
    const params = new URLSearchParams(searchParams);
    if (activeTab !== 'profile') {
      params.set('tab', activeTab);
    } else {
      params.delete('tab');
    }

    // Preserve any hash anchor (e.g. #oc-policy) so deep links from the
    // verification / OC notice still scroll to the relevant card after the
    // forced tab switch for contractors.
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const newUrl = params.toString()
      ? `?${params.toString()}${hash}`
      : `${window.location.pathname}${hash}`;
    router.replace(newUrl, { scroll: false });
  }, [activeTab, isMounted, router, searchParams]);

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

  // Wait for auth check to complete before redirecting
  React.useEffect(() => {
    // Mark that we've checked auth once we have a definitive answer
    if (!isLoading) {
      hasCheckedAuth.current = true;
    }
  }, [isLoading]);

  React.useEffect(() => {
    if (!user) {
      return;
    }
    if (user.userType === 'contractor' && activeTab === 'profile') {
      setActiveTab('contractor-data');
    }
    if (user.userType === 'manager' && activeTab === 'company') {
      setActiveTab('profile');
    }
  }, [user, activeTab]);

  // Redirect to login only after we've confirmed no user and no session
  // This is a fallback in case middleware doesn't catch it (e.g., in test environment)
  React.useEffect(() => {
    // Don't redirect if still loading or if we haven't checked auth yet
    if (isLoading || !hasCheckedAuth.current) {
      return;
    }

    // If we have a session but no user, it means user profile is being loaded
    // Don't redirect in this case - wait for user to load
    if (session && !user) {
      return;
    }

    // Only redirect if we're sure there's no user and no session
    if (!user && !session) {
      // Preserve redirectTo parameter from current URL (set by middleware) or use current pathname
      const currentUrl = new URL(window.location.href);
      const redirectTo = currentUrl.searchParams.get('redirectTo') || window.location.pathname;
      const loginUrl = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
      router.push(loginUrl);
    }
  }, [user, session, isLoading, router]);

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
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <div className="relative flex-shrink-0">
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
                  <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold break-words">{user.firstName} {user.lastName}</h1>
                </div>
                <p className="text-gray-600 mb-1.5 sm:mb-2 md:mb-1 text-xs sm:text-sm md:text-base break-words">{user.email}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="capitalize">
                      {user.userType === 'manager' ? 'Zarządca' : 'Wykonawca'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {user.userType !== 'manager' && (
                      <>
                        {verificationStatus.state === 'approved' && (
                          <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-success" />
                        )}
                        {verificationStatus.state === 'pending' && (
                          <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-blue-600" />
                        )}
                        {verificationStatus.state === 'rejected' && (
                          <ShieldX className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-destructive" />
                        )}
                        {verificationStatus.state === 'unsubmitted' && (
                          <Shield className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0 text-destructive" />
                        )}
                        <span
                          className={cn(
                            'font-medium',
                            verificationStatus.state === 'approved' && 'text-success',
                            verificationStatus.state === 'pending' && 'text-blue-600',
                            verificationStatus.state === 'rejected' && 'text-destructive',
                            verificationStatus.state === 'unsubmitted' && 'text-destructive',
                          )}
                        >
                          {verificationStatus.state === 'approved' && 'Zweryfikowany'}
                          {verificationStatus.state === 'pending' && 'Oczekuje na weryfikację'}
                          {verificationStatus.state === 'rejected' && 'Weryfikacja odrzucona'}
                          {verificationStatus.state === 'unsubmitted' && 'Niezweryfikowany'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {user.userType === 'contractor' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => router.push('/contractor-dashboard')}
                  className="w-full sm:w-auto"
                >
                  Panel Wykonawcy
                </Button>
              )}
            </div>
          </div>

          {user.userType !== 'manager' && (
            <VerificationNotice
              status={verificationStatus}
              onAction={() => router.push('/verification')}
            />
          )}
          {ocOnboarding && (
            <OcPolicyNotice
              ocOnboarding={ocOnboarding}
              onAction={() => router.push('/account?tab=contractor-data#oc-policy')}
            />
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {user.userType === 'contractor' ? (
              <button
                onClick={() => setActiveTab('contractor-data')}
                className={cn(
                  "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                  activeTab === 'contractor-data'
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                Twoje dane
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('profile')}
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
              onClick={() => setActiveTab('security')}
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
              onClick={() => setActiveTab('contractor-notifications')}
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="profile" className="space-y-6">
            <ProfileForm user={user} />
            {user.userType === 'manager' && <CompanyManagementForm user={user} />}
          </TabsContent>

          <TabsContent value="contractor-data" className="space-y-6">
            <ProfileForm user={user} includeBusinessData />
            <ContractorInsuranceSettings userId={user.id} />
            <ContractorProfessionalQualificationsSettings userId={user.id} />
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
