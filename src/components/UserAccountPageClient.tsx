'use client'

import { Shield, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { useUserProfile } from '../contexts/AuthContext';
import type { UserAccountPageProps } from '../types/auth';
import { NotificationSettings } from './NotificationSettings';
import { PasswordForm } from './PasswordForm';
import { ProfileForm } from './ProfileForm';
import { CompanyManagementForm } from './CompanyManagementForm';
import { DeleteAccountSection } from './DeleteAccountSection';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent } from './ui/tabs';
import { cn } from './ui/utils';

export function UserAccountPageClient({ 
  onBack, 
  onVerificationClick, 
  onManagerDashboardClick, 
  onContractorDashboardClick 
}: UserAccountPageProps) {
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
      if (tabFromUrl && ['profile', 'company', 'security', 'notifications'].includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
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
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [activeTab, isMounted, router, searchParams]);

  // Wait for auth check to complete before redirecting
  React.useEffect(() => {
    // Mark that we've checked auth once we have a definitive answer
    if (!isLoading) {
      hasCheckedAuth.current = true;
    }
  }, [isLoading]);

  // Redirect to login only after we've confirmed no user and no session
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
      router.push('/login');
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
                  {!user.isVerified && (
                    <Badge variant="destructive" className="text-[10px] sm:text-xs md:text-sm">
                      Ważne
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-1.5 sm:mb-2 md:mb-1 text-xs sm:text-sm md:text-base break-words">{user.email}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="capitalize">
                      {user.userType === 'manager' ? 'Zarządca' : 'Wykonawca'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span>
                      {user.isVerified ? 'Zweryfikowany' : 'Niezweryfikowany'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {!user.isVerified && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onVerificationClick}
                  className="w-full sm:w-auto"
                >
                  Zweryfikuj konto
                </Button>
              )}
              {user.userType === 'manager' && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onManagerDashboardClick}
                  className="w-full sm:w-auto"
                >
                  Panel Zarządcy
                </Button>
              )}
              {user.userType === 'contractor' && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onContractorDashboardClick}
                  className="w-full sm:w-auto"
                >
                  Panel Wykonawcy
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                activeTab === 'profile'
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={cn(
                "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                activeTab === 'company'
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Firma
            </button>
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
              onClick={() => setActiveTab('notifications')}
              className={cn(
                "px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0",
                activeTab === 'notifications'
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              Powiadomienia
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="profile" className="space-y-6">
            <ProfileForm user={user} />
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <CompanyManagementForm user={user} />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <PasswordForm />
            <DeleteAccountSection />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
