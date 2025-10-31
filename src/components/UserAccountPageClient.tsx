'use client'

import { ArrowLeft, Camera, Shield, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useUserProfile } from '../contexts/AuthContext';
import type { UserAccountPageProps } from '../types/auth';
import { NotificationSettings } from './NotificationSettings';
import { PasswordForm } from './PasswordForm';
import { ProfileForm } from './ProfileForm';
import { CompanyManagementForm } from './CompanyManagementForm';
import { Avatar, AvatarFallback } from './ui/avatar';
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
  const { user, isLoading } = useUserProfile();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Add timeout redirect to prevent infinite isLoading
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !user) {
        router.push('/login');
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [isLoading, user, router]);

  if (isLoading) {
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
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1>Ustawienia konta</h1>
              <p className="text-sm text-muted-foreground">
                Zarządzaj swoim profilem i ustawieniami
              </p>
            </div>
          </div>
        </div>
      </div>

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
            <Tabs defaultValue="profile" className="w-full">
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
