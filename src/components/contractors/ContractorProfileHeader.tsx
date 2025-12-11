"use client";

import { useState } from 'react';
import { Award, Building, Calendar, CheckCircle, Clock, MapPin, Phone, Shield, Star, Users, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useUserProfile } from '../../contexts/AuthContext';
import type { ContractorProfile } from '../../types/contractor';

interface ContractorProfileHeaderProps {
  profile: ContractorProfile | null;
}

export function ContractorProfileHeader({ profile }: ContractorProfileHeaderProps) {
  const router = useRouter();
  const { user } = useUserProfile();
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);

  const handleRequestQuote = () => {
    if (!user?.id) {
      toast.error('Musisz być zalogowany, aby wysłać zapytanie o wycenę');
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!profile?.id) {
      toast.error('Nie można znaleźć profilu wykonawcy');
      return;
    }

    // Dispatch custom event to open quote modal
    window.dispatchEvent(new CustomEvent('openQuoteModal'));
  };

  if (!profile) {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0">
                <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">WY</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Nie znaleziono wykonawcy</h1>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base">Profil nie istnieje</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contractorData = {
    name: profile.companyName,
    shortName: profile.companyName.split(' ')[0],
    avatar: profile.avatar || '',
    verified: profile.verification?.status === 'verified',
    hasInsurance: profile.insurance?.hasOC || false,
    premium: profile.plan === 'pro',
    rating: profile.rating?.overall || 0,
    reviewCount: profile.rating?.reviewsCount || 0,
    completedJobs: profile.experience?.completedProjects || 0,
    location: profile.location?.city || 'Warszawa',
    founded: profile.businessInfo?.yearEstablished || new Date().getFullYear(),
    employees: profile.businessInfo?.employeeCount || '1-5',
    responseTime: profile.stats?.responseTime || '',
    phone: profile.contactInfo?.phone || '',
    specialties: [...(profile.services?.primary || []), ...(profile.services?.secondary || [])].slice(0, 5),
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 md:gap-6 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
                <AvatarImage src={contractorData.avatar} />
                <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">
                  {contractorData.shortName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {contractorData.premium && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 rounded-full p-1 sm:p-1.5 md:p-2">
                  <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold">{contractorData.name}</h1>
                {contractorData.verified && (
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
                {contractorData.hasInsurance && (
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
                {contractorData.premium && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs md:text-sm">
                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {contractorData.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{contractorData.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Działa od {contractorData.founded}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{contractorData.employees} pracowników</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                {contractorData.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <span className="font-medium">
                      {contractorData.rating.toFixed(1)} ({contractorData.reviewCount} {contractorData.reviewCount === 1 ? 'opinia' : contractorData.reviewCount < 5 ? 'opinie' : 'opinii'})
                    </span>
                  </div>
                )}
                {contractorData.completedJobs > 0 && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="font-medium">
                      {contractorData.completedJobs} {contractorData.completedJobs === 1 ? 'zlecenie' : contractorData.completedJobs < 5 ? 'zlecenia' : 'zleceń'}
                    </span>
                  </div>
                )}
              </div>
              {contractorData.specialties && contractorData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                  {contractorData.specialties.map((specialty: string, index: number) => (
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
