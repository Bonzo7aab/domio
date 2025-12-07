"use client";

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { fetchContractorById } from '../../../lib/database/contractors';
import { Card, CardContent } from '../../../components/ui/card';
import ServicePricingManager from '../../../components/ServicePricingManager';
import type { ContractorProfile } from '../../../lib/database/contractors';

interface PricingContentProps {
  companyId: string;
  initialProfile: ContractorProfile | null;
}

export function PricingContent({ companyId, initialProfile }: PricingContentProps) {
  const [profile, setProfile] = useState(initialProfile);

  const handleServicesUpdate = async () => {
    // Refresh profile data when services are updated
    if (companyId) {
      const updatedProfile = await fetchContractorById(companyId);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
  };

  if (!profile?.services) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Ładowanie danych</h3>
          <p className="text-gray-600">
            Trwa ładowanie informacji o usługach...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ServicePricingManager
      companyId={companyId}
      services={profile.services}
      onServicesUpdate={handleServicesUpdate}
    />
  );
}

