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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-primary text-white text-xl">NF</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">Nowa firma</h1>
                <p className="text-gray-600">Profil w trakcie uzupełniania</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/account')}>
                Profil użytkownika
              </Button>
              <Button onClick={handleBrowseJobs}>
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={contractorData.avatar} />
                <AvatarFallback className="bg-primary text-white text-xl">
                  {contractorData.shortName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              {contractorData.premium && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2">
                  <Award className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{contractorData.name}</h1>
                {contractorData.verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <Shield className="w-3 h-3 mr-1" />
                    Zweryfikowana
                  </Badge>
                )}
                {contractorData.premium && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Award className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 mb-1">
                {contractorData.specialization || 'Nie określono specjalizacji'}
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                {contractorData.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{contractorData.address}</span>
                  </div>
                )}
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-yellow-600 transition-colors"
                  onClick={() => router.push('/contractor-dashboard/ratings')}
                >
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>
                    {contractorData.rating > 0 
                      ? `${contractorData.rating} (${contractorData.completedJobs} projektów)`
                      : 'Brak ocen'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {contractorData.responseTime && contractorData.responseTime !== 'Brak danych'
                      ? `Odpowiada w ciągu ${contractorData.responseTime}`
                      : 'Brak danych o czasie odpowiedzi'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/account')}>
              Profil użytkownika
            </Button>
            <Button onClick={handleBrowseJobs}>
              Przeglądaj zlecenia
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

