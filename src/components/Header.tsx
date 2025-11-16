'use client'

import React, { useState, useEffect } from 'react';
import { Search, Bell, User, MessageCircle, GraduationCap, Play, Bookmark, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { UnifiedNotifications } from './UnifiedNotifications';
import { useUserProfile } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { AuthUser } from '../types/auth';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  initialUser?: AuthUser | null;
}

export function Header({ initialUser }: HeaderProps) {
  const router = useRouter()
  const { user: contextUser, session, isAuthenticated: contextIsAuthenticated, logout, isLoading } = useUserProfile();
  const [isMounted, setIsMounted] = useState(false);

  // Ensure consistent hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Authentication state: use context (which is immediately true when session exists)
  // Only use after mount to prevent hydration mismatch
  const userIsAuthenticated = isMounted ? contextIsAuthenticated : false
  
  // Determine current user for display:
  // Priority: contextUser > initialUser > temporary user from session
  // This ensures we show user info immediately after login, even if profile is still loading
  const currentUser = contextUser || initialUser || 
    (session?.user ? {
      id: session.user.id,
      email: session.user.email || '',
      firstName: session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'User',
      lastName: session.user.user_metadata?.last_name || '',
      userType: session.user.user_metadata?.user_type || 'contractor',
    } as AuthUser : null)
  
  // Enhanced logout that redirects to login
  // We don't call router.refresh() to avoid race condition where server might still see session cookie
  // The context state update will handle the UI update, then we redirect
  const handleLogout = async () => {
    await logout()
    // Redirect to login - the new page load will have correct server state
    router.push('/login')
  }

  // Navigation handlers
  const handleAddJobClick = () => {
    router.push('/job-type-selection')
  }

  const handleManagerPageClick = () => {
    router.push('/managers')
  }

  const handleContractorPageClick = () => {
    router.push('/contractors')
  }

  const handlePricingClick = () => {
    router.push('/pricing')
  }

  const handleLoginClick = () => {
    router.push('/user-type-selection')
  }

  const handleRegisterClick = () => {
    router.push('/register')
  }

  const handleAccountClick = () => {
    router.push('/account')
  }

  const handleJobSelect = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }


  const handleBookmarkedJobsClick = () => {
    router.push('/bookmarked-jobs')
  }

  const handleMessagingClick = () => {
    router.push('/messages')
  }

  const handleWelcomeClick = () => {
    router.push('/welcome')
  }

  const handleTutorialClick = () => {
    router.push('/tutorial')
  }

  const handleProfileCompletionClick = () => {
    router.push('/profile-completion')
  }


  const handleHomeClick = () => {
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 1. Logo Section - Left */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold cursor-pointer" style={{ color: '#1e40af' }} onClick={handleHomeClick}>Domio</h1>
          </div>

          {/* 2. Center Content - Navigation and Search Bar (Hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-4 flex-1 justify-center">
            {/* Navigation buttons */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={handleContractorPageClick} className="text-sm hover:bg-gray-200">
                Wykonawcy
              </Button>
              <Button variant="ghost" size="sm" onClick={handleManagerPageClick} className="text-sm hover:bg-gray-200">
                Zarządcy Nieruchomości
              </Button>
              {false && (
                <Button variant="ghost" size="sm" onClick={handlePricingClick} className="text-sm hover:bg-gray-200">
                  Cennik
                </Button>
              )}
            </div>
            
            {/* Fixed Width Search Bar */}
            <div className="hidden lg:block">
              <Button
                variant="outline"
                className="flex items-center justify-between h-10 w-64 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // This will be handled by the GlobalCommandPalette component
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    ctrlKey: typeof window !== 'undefined' && navigator.platform.includes('Mac') ? true : false,
                  });
                  document.dispatchEvent(event);
                }}
              >
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span className="text-sm">Szukaj...</span>
                </div>
                <div className="flex items-center space-x-1 text-xs">
                  <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">
                    {isMounted && typeof window !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">K</kbd>
                </div>
              </Button>
            </div>
          </div>

            {/* Add Job button - only visible on desktop for managers and unauthenticated users */}
            <div className="hidden md:block mr-4">
              {(!userIsAuthenticated || currentUser?.userType !== 'contractor') && (
                <Button variant="default" size="sm" onClick={handleAddJobClick} className="shrink-0 bg-blue-800 hover:bg-blue-900">
                  Dodaj Ogłoszenie
                </Button>
              )}
            </div>

          {/* 3. Right Side Actions - Notifications and User Dropdown (Always visible) */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Unified Notifications - only visible for authenticated users */}
            {userIsAuthenticated && (
              <UnifiedNotifications 
                onJobSelect={handleJobSelect}
                onSearchSelect={(query) => {
                  console.log('Search query:', query);
                }}
                onApplicationSelect={(applicationId) => {
                  console.log('Navigate to application:', applicationId);
                }}
                onTenderSelect={(tenderId) => {
                  console.log('Navigate to tender:', tenderId);
                }}
              />
            )}
            
            {/* User Actions */}
            {!isMounted || isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                <span className="text-sm text-gray-500">Ładowanie...</span>
              </div>
            ) : userIsAuthenticated ? (
              <>
                {/* Mobile: Drawer */}
                <div className="md:hidden">
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="border-b">
                      <DrawerTitle>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {currentUser?.firstName} {currentUser?.lastName}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser?.email}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {currentUser?.userType === 'manager' ? 'Zarządca' : 'Wykonawca'}
                          </p>
                        </div>
                      </DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto flex-1 p-4">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleAccountClick}
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Profil</span>
                        </Button>
                        
                        {/* Dashboard Options based on user type */}
                        {currentUser?.userType === 'manager' && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => router.push('/manager-dashboard')}
                          >
                            <User className="mr-2 h-4 w-4" />
                            <span>Panel Zarządcy</span>
                          </Button>
                        )}
                        
                        {currentUser?.userType === 'contractor' && (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => router.push('/contractor-dashboard')}
                          >
                            <User className="mr-2 h-4 w-4" />
                            <span>Panel Wykonawcy</span>
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleBookmarkedJobsClick}
                        >
                          <Bookmark className="mr-2 h-4 w-4" />
                          <span>Zapisane ogłoszenia</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleMessagingClick}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          <span>Wiadomości</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          <span>Powiadomienia</span>
                        </Button>
                        
                        <div className="h-px bg-border my-2" />
                        
                        {/* Help and Learning Section */}
                        <div className="px-2 py-1.5">
                          <p className="text-xs text-muted-foreground font-medium">POMOC I NAUKA</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleWelcomeClick}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          <span>Strona powitalna</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleTutorialClick}
                        >
                          <GraduationCap className="mr-2 h-4 w-4" />
                          <span>Tutorial</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleProfileCompletionClick}
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Uzupełnij profil</span>
                        </Button>
                        
                        <div className="h-px bg-border my-2" />
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Wyloguj się</span>
                        </Button>
                      </div>
                    </div>
                  </DrawerContent>
                  </Drawer>
                </div>

                {/* Desktop: DropdownMenu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="w-56 border border-gray-200 shadow-lg" 
                      align="end" 
                      forceMount
                      style={{ backgroundColor: '#f8fafc' }}
                    >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {currentUser?.firstName} {currentUser?.lastName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser?.userType === 'manager' ? 'Zarządca' : 'Wykonawca'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAccountClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profil</span>
                    </DropdownMenuItem>
                    
                    {/* Dashboard Options based on user type */}
                    {currentUser?.userType === 'manager' && (
                      <DropdownMenuItem onClick={() => router.push('/manager-dashboard')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Panel Zarządcy</span>
                      </DropdownMenuItem>
                    )}
                    
                    {currentUser?.userType === 'contractor' && (
                      <DropdownMenuItem onClick={() => router.push('/contractor-dashboard')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Panel Wykonawcy</span>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={handleBookmarkedJobsClick}>
                      <Bookmark className="mr-2 h-4 w-4" />
                      <span>Zapisane ogłoszenia</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMessagingClick}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Wiadomości</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Powiadomienia</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    {/* Help and Learning Section */}
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      POMOC I NAUKA
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleWelcomeClick}>
                      <Play className="mr-2 h-4 w-4" />
                      <span>Strona powitalna</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleTutorialClick}>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      <span>Tutorial</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleProfileCompletionClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Uzupełnij profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Wyloguj się</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <>
                {/* Mobile: Drawer */}
                <div className="md:hidden">
                  <Drawer>
                    <DrawerTrigger asChild>
                    <Button variant="default" size="sm" className="text-sm bg-gray-200 hover:bg-gray-300 text-black">
                      <User className="h-4 w-4 mr-2" />
                      Zaloguj się / Zarejestruj
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="border-b">
                      <DrawerTitle>Konto</DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto flex-1 p-4">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleLoginClick}
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Zaloguj się</span>
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleRegisterClick}
                        >
                          <User className="mr-2 h-4 w-4" />
                          <span>Zarejestruj się</span>
                        </Button>
                      </div>
                    </div>
                  </DrawerContent>
                  </Drawer>
                </div>

                {/* Desktop: DropdownMenu */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm" className="text-sm bg-gray-200 hover:bg-gray-300 text-black">
                        <User className="h-4 w-4 mr-2" />
                        Zaloguj się / Zarejestruj
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 border border-gray-200 shadow-lg" 
                      align="end"
                      style={{ backgroundColor: '#f8fafc' }}
                    >
                    <DropdownMenuItem onClick={handleLoginClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Zaloguj się</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRegisterClick}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Zarejestruj się</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
            
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;