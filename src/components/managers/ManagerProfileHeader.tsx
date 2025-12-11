"use client";

import { useState } from 'react';
import { Award, Building, Calendar, CheckCircle, Clock, MapPin, Phone, Shield, Star, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useUserProfile } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase/client';
import { getManagerUserId, findExistingConversation, createConversation } from '../../lib/database/messaging';
import type { ManagerProfile } from '../../lib/database/managers';

interface ManagerProfileHeaderProps {
  profile: ManagerProfile | null;
}

export function ManagerProfileHeader({ profile }: ManagerProfileHeaderProps) {
  const router = useRouter();
  const { user } = useUserProfile();
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);

  const handleBack = () => {
    router.push('/managers');
  };

  const handleStartConversation = async () => {
    if (!user?.id) {
      toast.error('Musisz być zalogowany, aby rozpocząć konwersację');
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!profile?.id) {
      toast.error('Nie można znaleźć profilu zarządcy');
      return;
    }

    try {
      const supabase = createClient();

      // Get manager's user ID from company ID
      const managerUserResult = await getManagerUserId(supabase, profile.id);

      if (managerUserResult.error) {
        console.error('Error getting manager user ID:', managerUserResult.error);
        toast.error('Nie udało się znaleźć konta zarządcy');
        return;
      }

      if (!managerUserResult.data) {
        toast.error('Ten zarządca nie ma aktywnego konta w systemie. Skontaktuj się z nim bezpośrednio.');
        return;
      }

      const managerUserId = managerUserResult.data;

      // Check if conversation already exists
      const existingConvResult = await findExistingConversation(
        supabase,
        user.id,
        managerUserId
      );

      if (existingConvResult.error) {
        console.error('Error finding existing conversation:', existingConvResult.error);
        // Continue to create new conversation
      }

      let conversationId = existingConvResult.data;

      // If no existing conversation, create a new one
      if (!conversationId) {
        const newConvResult = await createConversation(supabase, {
          participant1: user.id,
          participant2: managerUserId,
          subject: `Zapytanie o współpracę - ${profile.name}`,
        });

        if (newConvResult.error || !newConvResult.data) {
          console.error('Error creating conversation:', newConvResult.error);
          toast.error('Nie udało się utworzyć konwersacji');
          return;
        }

        conversationId = newConvResult.data;
      }

      // Navigate to messages page with the conversation
      router.push(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Error in handleStartConversation:', error);
      toast.error('Wystąpił błąd podczas rozpoczynania konwersacji');
    }
  };

  if (!profile) {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0">
                <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">NZ</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Nie znaleziono zarządcy</h1>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base">Profil nie istnieje</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getEmployeeCount = (type: string) => {
    const counts: Record<string, string> = {
      'wspólnota': '5-15',
      'spółdzielnia': '15-50',
      'zarządca': '25-100',
      'deweloper': '50-200',
      'tbs': '5-25',
      'administracja': '5-25',
    };
    return counts[type] || '5-25';
  };

  const managerData = {
    name: profile.name,
    shortName: profile.name.split(' ')[0],
    organizationType: profile.organizationType,
    avatar: profile.avatar || '',
    verified: profile.verification?.status === 'verified',
    hasInsurance: true, // Assuming all managers have insurance
    premium: profile.organizationType === 'deweloper' || profile.organizationType === 'zarządca',
    rating: profile.rating?.overall || 0,
    reviewCount: profile.rating?.reviewsCount || 0,
    buildingsCount: profile.managedProperties?.buildingsCount || 0,
    unitsCount: profile.managedProperties?.unitsCount || 0,
    location: profile.location?.city || 'Warszawa',
    founded: profile.businessInfo?.yearEstablished || new Date().getFullYear(),
    employees: getEmployeeCount(profile.organizationType),
    responseTime: profile.stats?.averageResponseTime || '',
    phone: profile.contactInfo?.phone || '',
    specialties: profile.services?.primaryNeeds?.slice(0, 5) || [],
  };

  const getOrganizationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'wspólnota': 'Wspólnota mieszkaniowa',
      'spółdzielnia': 'Spółdzielnia mieszkaniowa',
      'zarządca': 'Zarządca nieruchomości',
      'deweloper': 'Deweloper',
      'tbs': 'TBS',
      'administracja': 'Administracja nieruchomości',
    };
    return labels[type] || 'Zarządca nieruchomości';
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 md:gap-6 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
                <AvatarImage src={managerData.avatar} />
                <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">
                  {managerData.shortName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {managerData.premium && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 rounded-full p-1 sm:p-1.5 md:p-2">
                  <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">{managerData.name}</h1>
                {managerData.verified && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-green-100 text-green-800 p-1 h-auto cursor-help">
                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zweryfikowany</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {managerData.hasInsurance && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-blue-100 text-blue-800 p-1 h-auto cursor-help">
                        <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ubezpieczenie OC</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {managerData.premium && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs md:text-sm">
                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {managerData.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{managerData.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Działa od {managerData.founded}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{managerData.employees} pracowników</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {managerData.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <span className="font-medium">
                      {managerData.rating.toFixed(1)} ({managerData.reviewCount} {managerData.reviewCount === 1 ? 'opinia' : managerData.reviewCount < 5 ? 'opinie' : 'opinii'})
                    </span>
                  </div>
                )}
              </div>
              {managerData.specialties && managerData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  {managerData.specialties.map((specialty: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-[10px] sm:text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

