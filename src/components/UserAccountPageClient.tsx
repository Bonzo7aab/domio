'use client'

import { ArrowLeft, Camera, Shield, User } from 'lucide-react';
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
import { Card, CardContent, CardHeader } from './ui/card';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
    <div className="min-h-screen bg-background">

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm capitalize">
                        {user.userType === 'manager' ? 'Zarządca' : 'Wykonawca'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="text-sm">
                        {user.isVerified ? 'Zweryfikowany' : 'Niezweryfikowany'}
                      </span>
                      {!user.isVerified && (
                        <Badge variant="destructive" className="ml-2">
                          Ważne
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  {!user.isVerified && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={onVerificationClick}
                    >
                      Zweryfikuj konto
                    </Button>
                  )}
                  {user.userType === 'manager' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={onManagerDashboardClick}
                    >
                      Panel Zarządcy
                    </Button>
                  )}
                  {user.userType === 'contractor' && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={onContractorDashboardClick}
                    >
                      Panel Wykonawcy
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings Tabs */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="company">Firma</TabsTrigger>
                  <TabsTrigger value="security">Bezpieczeństwo</TabsTrigger>
                  <TabsTrigger value="notifications">Powiadomienia</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <CardContent className="space-y-6">
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
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
