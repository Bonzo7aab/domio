import React, { useState } from 'react';
import { ValidationSurvey } from './ValidationSurvey';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Download, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface SurveyPageProps {
  onBack: () => void;
}

export function SurveyPage({ onBack }: SurveyPageProps) {
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [surveyData, setSurveyData] = useState<any>(null);

  const handleSurveyComplete = (data: any) => {
    setSurveyData(data);
    setSurveyCompleted(true);
    
    // Simulate sending data to backend
    console.log('Survey data:', data);
    
    // Save to localStorage as backup
    localStorage.setItem('urbi-survey-data', JSON.stringify(data));
    
    toast.success('Ankieta została zapisana pomyślnie!');
  };

  const handleDownloadData = () => {
    if (!surveyData) return;
    
    const dataStr = JSON.stringify(surveyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urbi-survey-${surveyData.userType}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Dane zostały pobrane!');
  };

  const handleSendEmail = () => {
    if (!surveyData) return;
    
    const subject = `Ankieta Urbi.eu - ${surveyData.userType === 'manager' ? 'Zarządca' : 'Wykonawca'}`;
    const body = `
Dziękujemy za wypełnienie ankiety Urbi.eu!

Typ użytkownika: ${surveyData.userType === 'manager' ? 'Zarządca Nieruchomości' : 'Wykonawca'}
Data wypełnienia: ${new Date(surveyData.submittedAt).toLocaleDateString('pl-PL')}

Dane kontaktowe:
- Imię: ${surveyData.personalInfo.name || 'Nie podano'}
- Email: ${surveyData.personalInfo.email || 'Nie podano'}
- Telefon: ${surveyData.personalInfo.phone || 'Nie podano'}
- Firma: ${surveyData.personalInfo.company || 'Nie podano'}

Skontaktujemy się z Państwem wkrótce!

Zespół Urbi.eu
    `.trim();

    const mailtoLink = `mailto:surveys@urbi.eu?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  if (surveyCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
              
              <h1 className="text-2xl font-bold mb-4">
                Dziękujemy za udział w ankiecie!
              </h1>
              
              <div className="space-y-4 mb-8">
                <p className="text-gray-600">
                  Twoja opinia jest dla nas bardzo cenna. Pomoże nam stworzyć platformę, 
                  która rzeczywiście rozwiąże problemy branży zarządzania nieruchomościami.
                </p>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-900">Co dalej?</h3>
                  <ul className="text-sm text-blue-800 space-y-2 text-left">
                    <li>• Przeanalizujemy wszystkie odpowiedzi z ankiety</li>
                    <li>• Uwzględnimy Twoje sugestie w rozwoju platformy</li>
                    <li>• Skontaktujemy się z Tobą, gdy będzie gotowa wersja beta</li>
                    <li>• Otrzymasz darmowy dostęp do testów jako uczestnik ankiety</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Uwaga:</strong> Jeśli chcesz otrzymać kopię swoich odpowiedzi, 
                    użyj poniższych przycisków przed opuszczeniem strony.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
                <Button onClick={handleDownloadData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Pobierz kopię odpowiedzi
                </Button>
                
                <Button onClick={handleSendEmail} variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Wyślij email z potwierdzeniem
                </Button>
                
                <Button 
                  onClick={() => window.open('https://www.linkedin.com/company/urbi-eu/', '_blank')}
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Śledź nas na LinkedIn
                </Button>
              </div>

              <div className="text-center">
                <Button onClick={onBack} className="bg-primary hover:bg-primary/90">
                  Wróć do portalu
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t text-sm text-gray-500">
                <p>Masz pytania? Skontaktuj się z nami: <strong>hello@urbi.eu</strong></p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <ValidationSurvey onComplete={handleSurveyComplete} onBack={onBack} />;
}