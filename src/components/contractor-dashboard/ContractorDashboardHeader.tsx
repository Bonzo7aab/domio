"use client";

import { Award, Clock, MapPin, Shield, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { getContractorAddress } from './shared/utils';
import type { ContractorProfile } from '../../lib/database/contractors';

interface ContractorDashboardHeaderProps {
  profile: ContractorProfile | null;
  stats?: {
    averageRating: number;
    completedProjects: number;
  } | null;
}

export function ContractorDashboardHeader({ profile, stats }: ContractorDashboardHeaderProps) {
  const router = useRouter();

  const handleBrowseJobs = () => {
    router.push('/');
  };

  if (!profile) {
    return (
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0">
                <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">NF</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Nowa firma</h1>
                <p className="text-gray-600 text-xs sm:text-sm md:text-base">Profil w trakcie uzupełniania</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={() => router.push('/account')} className="w-full sm:w-auto">
                Profil użytkownika
              </Button>
              <Button onClick={handleBrowseJobs} className="w-full sm:w-auto">
                Przeglądaj zlecenia
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contractorData = {
    name: profile.name,
    shortName: profile.name.split(' ')[0],
    specialization: profile.services?.primary?.join(', ') || 'Różne usługi budowlane',
    address: getContractorAddress(profile),
    avatar: profile.avatar || '',
    verified: profile.verification?.status === 'verified',
    premium: profile.plan === 'pro',
    rating: stats?.averageRating || 0,
    completedJobs: stats?.completedProjects || 0,
    responseTime: '24h', // Could be calculated from applications
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            <div className="relative flex-shrink-0">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
                <AvatarImage src={contractorData.avatar} />
                <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">
                  {contractorData.shortName.slice(0, 2)}
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
                  <Badge className="bg-green-100 text-green-800 text-[10px] sm:text-xs md:text-sm">
                    <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Zweryfikowana
                  </Badge>
                )}
                {contractorData.premium && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs md:text-sm">
                    <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mb-1.5 sm:mb-2 md:mb-1 text-xs sm:text-sm md:text-base">
                {contractorData.specialization || 'Nie określono specjalizacji'}
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-500">
                {contractorData.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{contractorData.address}</span>
                  </div>
                )}
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-yellow-600 transition-colors"
                  onClick={() => router.push('/contractor-dashboard/ratings')}
                >
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  <span>
                    {contractorData.rating > 0 
                      ? `${contractorData.rating} (${contractorData.completedJobs} projektów)`
                      : 'Brak ocen'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">
                    {contractorData.responseTime && contractorData.responseTime !== 'Brak danych'
                      ? `Odpowiada w ciągu ${contractorData.responseTime}`
                      : 'Brak danych o czasie odpowiedzi'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => router.push('/account')} className="w-full sm:w-auto">
              Profil użytkownika
            </Button>
            <Button onClick={handleBrowseJobs} className="w-full sm:w-auto">
              Przeglądaj zlecenia
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

