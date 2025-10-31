import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, FileText, Gavel, Clock, Users, Star, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface JobTypeSelectionPageProps {
  onBack: () => void;
  onSelectJob: () => void;
  onSelectTender: () => void;
  isAuthenticated?: boolean;
  userType?: 'contractor' | 'manager';
}

export default function JobTypeSelectionPage({ onBack, onSelectJob, onSelectTender, isAuthenticated, userType }: JobTypeSelectionPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Powrót
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dodaj ogłoszenie</h1>
              <p className="text-gray-600 mt-1">Wybierz odpowiedni typ ogłoszenia dla Twojego projektu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Zlecenie Card */}
          <Card className="relative transition-all hover:shadow-lg border-2 hover:border-primary">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Zlecenie</CardTitle>
              <p className="text-gray-600">Szybkie i bezpośrednie zlecenia dla rutynowych prac</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Ideal for */}
              <div>
                <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Idealne dla:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Prace konserwacyjne i utrzymaniowe</li>
                  <li>• Sprzątanie i utrzymanie czystości</li>
                  <li>• Małe naprawy i remonty (do 10,000 zł)</li>
                  <li>• Pilne interwencje (awarie, usterki)</li>
                  <li>• Sezonowe prace (odśnieżanie, koszenie)</li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Charakterystyka:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Clock className="w-3 h-3 mr-2 text-green-600" />
                    Szybka publikacja (1 formularz)
                  </li>
                  <li className="flex items-center">
                    <Users className="w-3 h-3 mr-2 text-green-600" />
                    Bezpośrednie aplikacje wykonawców
                  </li>
                  <li className="flex items-center">
                    <Shield className="w-3 h-3 mr-2 text-green-600" />
                    Elastyczny wybór wykonawcy
                  </li>
                </ul>
              </div>

              {/* Process */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-primary mb-2">Proces:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>1. Publikujesz zlecenie</div>
                  <div>2. Wykonawcy składają oferty</div>
                  <div>3. Wybierasz najlepszą ofertę</div>
                  <div>4. Rozpoczynasz współpracę</div>
                </div>
              </div>

              <Button onClick={onSelectJob} className="w-full" size="lg">
                Stwórz zlecenie
              </Button>
            </CardContent>
          </Card>

          {/* Przetarg Card */}
          <Card className="relative transition-all hover:shadow-lg border-2 hover:border-primary">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Gavel className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Przetarg</CardTitle>
              <p className="text-gray-600">Formalny proces konkurencji dla dużych projektów</p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Ideal for */}
              <div>
                <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Idealne dla:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Duże remonty i modernizacje (powyżej 10,000 zł)</li>
                  <li>• Wymiana wind, instalacji</li>
                  <li>• Termomodernizacje budynków</li>
                  <li>• Prace wymagające specjalistów</li>
                  <li>• Długoterminowe kontrakty serwisowe</li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h3 className="font-semibold text-purple-600 mb-3 flex items-center">
                  <Star className="w-4 h-4 mr-2" />
                  Charakterystyka:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <Shield className="w-3 h-3 mr-2 text-purple-600" />
                    Przejrzyste kryteria oceny
                  </li>
                  <li className="flex items-center">
                    <Users className="w-3 h-3 mr-2 text-purple-600" />
                    Formalna konkurencja ofert
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-3 h-3 mr-2 text-purple-600" />
                    Obiektywny system punktowy
                  </li>
                </ul>
              </div>

              {/* Process */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-600 mb-2">Proces:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>1. Tworzysz przetarg z kryteriami</div>
                  <div>2. Wykonawcy składają oferty</div>
                  <div>3. System ocenia według punktów</div>
                  <div>4. Wybierasz zwycięzcę transparentnie</div>
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Wymagane zalogowanie jako zarządca
                    </p>
                  </div>
                  <Button onClick={onSelectTender} className="w-full" size="lg" variant="outline">
                    Zaloguj się i utwórz przetarg
                  </Button>
                </div>
              ) : userType !== 'manager' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Przetargi mogą tworzyć tylko zarządcy
                    </p>
                  </div>
                  <Button disabled className="w-full" size="lg" variant="outline">
                    Dostępne dla zarządców
                  </Button>
                </div>
              ) : (
                <Button onClick={onSelectTender} className="w-full" size="lg" variant="outline">
                  Utwórz przetarg
                </Button>
              )}
            </CardContent>
          </Card>
        </div>


      </div>
    </div>
  );
}