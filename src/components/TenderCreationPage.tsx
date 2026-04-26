import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { TenderCreationFormInline } from './TenderCreationFormInline';
import { useUserProfile } from '../contexts/AuthContext';
import { createClient } from '../lib/supabase/client';
import { createTender } from '../lib/database/jobs';
import { fetchUserPrimaryCompany } from '../lib/database/companies';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface TenderCreationPageProps {
  onBack: () => void;
}

interface NewTender {
  title: string;
  description: string;
  category: string;
  location: string;
  estimatedValue: string;
  currency: string;
  submissionDeadline: Date;
  evaluationDeadline: Date;
  requirements: string[];
  evaluationCriteria: EvaluationCriterion[];
  documents: TenderDocument[];
  isPublic: boolean;
  allowQuestions: boolean;
  questionsDeadline?: Date;
  minimumExperience: number;
  requiredCertificates: string[];
  insuranceRequired: string;
  advancePayment: boolean;
  performanceBond: boolean;
  status?: 'draft' | 'active';
}

interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  type: 'price' | 'quality' | 'time' | 'experience';
}

interface TenderDocument {
  id: string;
  name: string;
  type: 'specification' | 'requirements' | 'drawings' | 'other';
  file: File;
}

export default function TenderCreationPage({ onBack }: TenderCreationPageProps) {
  const { user, session, isLoading } = useUserProfile();
  const router = useRouter();
  
  // Redirect to login if not authenticated (fallback in case middleware doesn't catch it)
  useEffect(() => {
    if (!isLoading && !user && !session) {
      const currentUrl = new URL(window.location.href);
      const redirectTo = currentUrl.searchParams.get('redirectTo') || window.location.pathname;
      const loginUrl = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
      router.push(loginUrl);
    }
  }, [user, session, isLoading, router]);

  const handleTenderSubmit = async (tender: NewTender) => {
    if (!user?.id) {
      toast.error('Musisz być zalogowany, aby utworzyć przetarg');
      return;
    }

    try {
      const supabase = createClient();
      
      // Get user's primary company
      const { data: company, error: companyError } = await fetchUserPrimaryCompany(supabase, user.id);
      
      if (companyError || !company) {
        toast.error('Nie znaleziono firmy. Proszę najpierw uzupełnić dane firmy w profilu.');
        console.error('Error fetching company:', companyError);
        return;
      }

      // Save tender to database
      const { error: saveError } = await createTender(supabase, {
        ...(tender as {
          title: string;
          description: string;
          category: string;
          location: string;
          estimatedValue: string;
          currency: string;
          submissionDeadline: Date;
          evaluationDeadline: Date;
          requirements: string[];
          evaluationCriteria: Array<{ id: string; name: string; description: string; weight: number; type: 'price' | 'quality' | 'time' | 'experience' | 'other' }>;
          documents: Array<{ id: string; name: string; type: 'specification' | 'requirements' | 'drawings' | 'other'; file: File }>;
          isPublic: boolean;
          allowQuestions: boolean;
          questionsDeadline?: Date;
          minimumExperience: number;
          requiredCertificates: string[];
          insuranceRequired: string;
          advancePayment: boolean;
          performanceBond: boolean;
          status?: 'draft' | 'active';
          address?: string;
          latitude?: number;
          longitude?: number;
          projectDuration?: string;
        }),
        managerId: user.id,
        companyId: company.id,
      });

      if (saveError) {
        toast.error('Nie udało się zapisać przetargu: ' + (saveError.message || 'Nieznany błąd'));
        console.error('Error saving tender:', saveError);
        return;
      }

      toast.success(tender.status === 'draft' ? 'Przetarg zapisany jako szkic' : 'Przetarg został opublikowany');
      
      // Redirect to manager dashboard tenders tab to see the new tender
      router.push('/manager-dashboard/tenders');
    } catch (error) {
      toast.error('Wystąpił błąd podczas zapisywania przetargu');
      console.error('Error in handleTenderSubmit:', error);
    }
  };

  const handleFormClose = () => {
    onBack();
  };

  // Don't render if not authenticated (will redirect)
  if (!isLoading && !user && !session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="hidden md:flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Powrót do wyboru typu ogłoszenia
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Opublikuj nowy przetarg</h1>
              <p className="text-gray-600">Znajdź najlepszych wykonawców dla większych realizacji</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <TenderCreationFormInline
          onClose={handleFormClose}
          onSubmit={handleTenderSubmit}
        />
      </div>
    </div>
  );
}