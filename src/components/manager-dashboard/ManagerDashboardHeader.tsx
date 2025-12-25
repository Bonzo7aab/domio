"use client";

import { Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { getCompanyTypeDisplayName, getCompanyAddress } from './shared/utils';
import type { CompanyData } from '../../lib/database/companies';

interface ManagerDashboardHeaderProps {
  company: CompanyData | null;
  userEmail?: string | null;
  userCompany?: string | null;
}

export function ManagerDashboardHeader({ company, userEmail, userCompany }: ManagerDashboardHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  const handlePostJob = () => {
    if (!company) {
      toast.error('Najpierw musisz dodać dane firmy w profilu');
      router.push('/account?tab=company');
      return;
    }
    router.push('/post-job');
  };

  const handleTenderCreate = () => {
    if (!company) {
      toast.error('Najpierw musisz dodać dane firmy w profilu');
      router.push('/account?tab=company');
      return;
    }
    router.push('/manager-dashboard/tenders?create=true');
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Avatar className="w-16 h-16">
              <AvatarImage src={company?.logo_url || ''} />
              <AvatarFallback className="bg-primary text-white">
                {(company?.name || userCompany || 'N').split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{company?.name || userCompany || 'Nowa organizacja'}</h1>
              <p className="text-gray-600">{getCompanyTypeDisplayName(company?.type || null)}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                {getCompanyAddress(company) && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{getCompanyAddress(company)}</span>
                  </div>
                )}
                {company?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {(company?.email || userEmail) && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{company?.email || userEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleTenderCreate}>
              Utwórz przetarg
            </Button>
            <Button onClick={handlePostJob}>
              Opublikuj zlecenie
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
