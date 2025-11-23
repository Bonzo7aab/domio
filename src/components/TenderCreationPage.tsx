import React from 'react';
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
  const { user } = useUserProfile();
  const router = useRouter();

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
      const { data: savedTender, error: saveError } = await createTender(supabase, {
        ...tender,
        managerId: user.id,
        companyId: company.id,
      });

      if (saveError) {
        toast.error('Nie udało się zapisać przetargu: ' + (saveError.message || 'Nieznany błąd'));
        console.error('Error saving tender:', saveError);
        return;
      }

      toast.success(tender.status === 'draft' ? 'Przetarg zapisany jako szkic' : 'Przetarg został opublikowany');
      
      // Redirect to manager dashboard to see the new tender
      router.push('/manager-dashboard');
    } catch (error) {
      toast.error('Wystąpił błąd podczas zapisywania przetargu');
      console.error('Error in handleTenderSubmit:', error);
    }
  };

  const handleFormClose = () => {
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <nav className="flex space-x-2 text-sm text-gray-500">
                <span>Panel Zarządcy</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">Nowy Przetarg</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Zalogowany jako: <span className="font-medium">{user?.email}</span>
              </div>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Utwórz Nowy Przetarg</h1>
            <p className="mt-2 text-gray-600">
              Wypełnij formularz, aby opublikować przetarg na platformie Domio.
              Wszystkie pola oznaczone gwiazdką (*) są wymagane.
            </p>
          </div>

          {/* Tender Creation Form */}
          <div className="p-6">
            <TenderCreationFormInline
              onClose={handleFormClose}
              onSubmit={handleTenderSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}