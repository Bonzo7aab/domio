import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { TenderCreationFormInline } from './TenderCreationFormInline';
import { useUserProfile } from '../contexts/AuthContext';

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

  const handleTenderSubmit = (tender: NewTender) => {
    // W prawdziwej aplikacji tutaj byłoby wysyłanie danych do API
    console.log('Nowy przetarg:', tender);
    
    // Po pomyślnym utworzeniu przetargu, wracamy do poprzedniego widoku
    onBack();
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
              Wypełnij formularz, aby opublikować przetarg na platformie Urbi.eu. 
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