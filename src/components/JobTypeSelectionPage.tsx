import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, FileText, Clock, Users, Shield, CheckCircle, AlertCircle, Star } from 'lucide-react';
import Link from 'next/link';

interface JobTypeSelectionPageProps {
  onBack: () => void;
  onSelectJob: () => void;
  isAuthenticated?: boolean;
  userType?: 'contractor' | 'manager';
  hasCompany?: boolean | null;
  isCheckingCompany?: boolean;
}

export default function JobTypeSelectionPage({ onBack, onSelectJob, userType, hasCompany, isCheckingCompany }: JobTypeSelectionPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="hidden md:inline-flex">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dodaj zgłoszenie</h1>
              <p className="text-gray-600 mt-1">Utwórz jedno zgłoszenie i zbierz oferty od wykonawców</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Banner for missing company data */}
        {userType === 'manager' && hasCompany === false && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-700">
                  Najpierw musisz <Link href="/account?tab=company" className="text-blue-700 underline">dodać dane firmy w profilu</Link>, aby móc tworzyć zgłoszenia.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-8">
          
          {/* Zgłoszenie Card */}
          <Card className="relative transition-all hover:shadow-lg border-2 hover:border-primary">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Zgłoszenie</CardTitle>
              <p className="text-gray-600">Jedna ścieżka dla awarii, pilnych prac i tematów do wyceny</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Ideal for */}
              <div>
                <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Obejmuje:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Awarie wymagające natychmiastowej reakcji</li>
                  <li>• Pilne prace do realizacji w ciągu tygodnia</li>
                  <li>• Tematy, dla których potrzebna jest wycena</li>
                  <li>• Prace na nieruchomościach dodanych w profilu zarządcy</li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Workflow:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Clock className="w-3 h-3 mr-2 text-green-600" />
                    Zbieranie ofert i wybór wykonawcy
                  </li>
                  <li className="flex items-center">
                    <Users className="w-3 h-3 mr-2 text-green-600" />
                    Realizacja, odbiór i zakończenie prac
                  </li>
                  <li className="flex items-center">
                    <Shield className="w-3 h-3 mr-2 text-green-600" />
                    Raport techniczny do faktury po zakończeniu
                  </li>
                </ul>
              </div>

              {/* Process */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-primary mb-2">Statusy:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>1. Zbieranie ofert</div>
                  <div>2. Wybór ofert</div>
                  <div>3. W realizacji</div>
                  <div>4. Do odbioru</div>
                  <div>5. Zakończone</div>
                </div>
              </div>

              {userType === 'manager' && isCheckingCompany ? (
                <Button disabled className="w-full" size="lg">
                  Ładowanie...
                </Button>
              ) : userType === 'manager' && hasCompany === false ? (
                <Button disabled className="w-full" size="lg">
                  Stwórz zgłoszenie
                </Button>
              ) : (
                <Button onClick={onSelectJob} className="w-full" size="lg">
                  Stwórz zgłoszenie
                </Button>
              )}
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}