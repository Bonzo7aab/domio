'use client'

import React, { useEffect, useState } from 'react';
import { Search, Bell, User, Menu, MessageCircle, GraduationCap, Play, Bookmark, LogOut } from 'lucide-react';
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
import { Avatar, AvatarFallback } from './ui/avatar';
import type { AuthUser } from '../types/auth';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  initialUser?: AuthUser | null;
}

export function Header({ initialUser }: HeaderProps) {
  const router = useRouter()
  const { user: contextUser, isAuthenticated: contextIsAuthenticated, logout, isLoading } = useUserProfile();
  
  // Use context user for real-time updates, fall back to initial server-side user
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(initialUser || null)
  
  // Update current user when context user changes (for real-time updates)
  useEffect(() => {
    if (!isLoading) {
      setCurrentUser(contextUser || initialUser || null)
    }
  }, [contextUser, isLoading, initialUser])
  
  const userIsAuthenticated = !isLoading && (contextIsAuthenticated || !!currentUser)
  
  // Enhanced logout that refreshes the page
  const handleLogout = async () => {
    await logout()
    router.refresh() // Refresh server components
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
    <header className="domio-header sticky top-0 z-50" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 1. Logo Section - Left */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold cursor-pointer" style={{ color: '#1e40af' }} onClick={handleHomeClick}>Domio</h1>
          </div>

          {/* 2. Center Content - Navigation and Search Bar */}
          <div className="flex items-center space-x-4">
            {/* Navigation buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={handleContractorPageClick} className="text-sm hover:bg-gray-200">
                Wykonawcy
              </Button>
              <Button variant="ghost" size="sm" onClick={handleManagerPageClick} className="text-sm hover:bg-gray-200">
                Zarządcy Nieruchomości
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePricingClick} className="text-sm hover:bg-gray-200">
                Cennik
              </Button>
            </div>
            
            {/* Fixed Width Search Bar */}
            <div className="hidden sm:block">
              <Button
                variant="outline"
                className="flex items-center justify-between h-10 w-64 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // This will be handled by the GlobalCommandPalette component
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    ctrlKey: navigator.platform.includes('Mac') ? true : false,
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
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                  </kbd>
                  <kbd className="px-1.5 py-0.5 bg-muted border rounded text-xs">K</kbd>
                </div>
              </Button>
            </div>
          </div>

          {/* 3. Right Side Actions - Notifications and User Dropdown */}
          <div className="flex items-center space-x-3">
            {/* Unified Notifications - visible for all users */}
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
            
            {/* User Actions */}
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                <span className="text-sm text-gray-500">Ładowanie...</span>
              </div>
            ) : userIsAuthenticated ? (
              <>
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
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleLoginClick} className="text-sm bg-gray-200 hover:bg-gray-300">
                <User className="h-4 w-4 mr-2" />
                Zaloguj się
              </Button>
            )}
            
            {/* Mobile Search Button */}
            <div className="sm:hidden">
              <Button variant="ghost" size="icon" className="bg-gray-200 hover:bg-gray-300">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" className="bg-gray-200 hover:bg-gray-300">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Add Job button - only visible for managers and unauthenticated users */}
            {(!userIsAuthenticated || currentUser?.userType !== 'contractor') && (
              <Button variant="default" size="sm" onClick={handleAddJobClick} className="shrink-0 ml-2 bg-blue-800 hover:bg-blue-900">
                <span className="hidden sm:inline">Dodaj Ogłoszenie</span>
                <span className="sm:hidden">Dodaj</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;