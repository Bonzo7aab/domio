import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { CheckCircle, Building2, Users, ArrowRight, ArrowLeft } from 'lucide-react';

interface SurveyProps {
  onComplete: (data: any) => void;
  onBack?: () => void;
}

import type { UserType } from '../types/auth';

interface SurveyData {
  userType: UserType;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    company: string;
    position: string;
    experience: string;
  };
  responses: Record<string, any>;
}

export function ValidationSurvey({ onComplete, onBack }: SurveyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    userType: 'manager',
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      experience: ''
    },
    responses: {}
  });

  const updateResponse = (key: string, value: any) => {
    setSurveyData(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [key]: value
      }
    }));
  };

  const updatePersonalInfo = (key: string, value: string) => {
    setSurveyData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [key]: value
      }
    }));
  };

  // Pytania dla zarządców
  const managerQuestions = [
    {
      id: 'current_challenges',
      title: 'Jakie są Twoje największe wyzwania przy znajdowaniu wykonawców?',
      type: 'checkbox',
      options: [
        'Trudność w znalezieniu rzetelnych wykonawców',
        'Brak transparentności cenowej',
        'Długi proces porównywania ofert',
        'Problemy z jakością wykonanych usług',
        'Brak referencji i ocen',
        'Skomplikowane procedury przetargowe',
        'Ograniczony wybór lokalnych wykonawców'
      ]
    },
    {
      id: 'current_methods',
      title: 'Jak obecnie znajdujesz wykonawców?',
      type: 'checkbox',
      options: [
        'Rekomendacje od innych zarządców',
        'Wyszukiwanie w internecie',
        'Lokalne ogloszenia',
        'Bazy danych wykonawców',
        'Kontakt bezpośredni z firmami',
        'Platformy internetowe (OLX, Allegro Lokalnie)',
        'Stowarzyszenia branżowe'
      ]
    },
    {
      id: 'monthly_budget',
      title: 'Jaki jest Twój średni miesięczny budżet na usługi zewnętrzne?',
      type: 'select',
      options: [
        'Poniżej 10 000 zł',
        '10 000 - 25 000 zł',
        '25 000 - 50 000 zł',
        '50 000 - 100 000 zł',
        '100 000 - 200 000 zł',
        'Powyżej 200 000 zł'
      ]
    },
    {
      id: 'tender_frequency',
      title: 'Jak często organizujesz przetargi?',
      type: 'radio',
      options: [
        'Kilka razy w miesiącu',
        'Raz w miesiącu',
        'Kilka razy w roku',
        'Raz w roku',
        'Rzadziej niż raz w roku',
        'Nie organizuję przetargów'
      ]
    },
    {
      id: 'job_categories',
      title: 'Które kategorie usług zlecasz najczęściej?',
      type: 'checkbox',
      options: [
        'Utrzymanie czystości i zieleni',
        'Roboty remontowo-budowlane',
        'Utrzymanie techniczne i konserwacja',
        'Zarządzanie odpadami i recycling',
        'Ochrona i monitoring'
      ]
    },
    {
      id: 'platform_interest',
      title: 'Na ile przydatna byłaby platforma łącząca zarządców z wykonawcami? (1-10)',
      type: 'slider',
      min: 1,
      max: 10,
      step: 1
    },
    {
      id: 'key_features',
      title: 'Które funkcjonalności byłyby dla Ciebie najważniejsze?',
      type: 'checkbox',
      options: [
        'System ocen i referencji wykonawców',
        'Transparentne porównywanie ofert',
        'Automatyzacja procesów przetargowych',
        'Wyszukiwanie po lokalizacji',
        'Historia współpracy z wykonawcami',
        'Komunikacja wewnątrz platformy',
        'Zarządzanie dokumentacją projektów'
      ]
    },
    {
      id: 'decision_factors',
      title: 'Co jest najważniejsze przy wyborze wykonawcy?',
      type: 'ranking',
      options: [
        'Cena oferty',
        'Doświadczenie i referencje',
        'Terminowość realizacji',
        'Jakość wykonanych prac',
        'Lokalizacja wykonawcy',
        'Posiadane certyfikaty i ubezpieczenia'
      ]
    },
    {
      id: 'pain_points',
      title: 'Co frustruje Cię najbardziej w obecnym procesie?',
      type: 'textarea',
      placeholder: 'Opisz swoje doświadczenia...'
    },
    {
      id: 'time_savings',
      title: 'Ile czasu tygodniowo poświęcasz na znajdowanie i zarządzanie wykonawcami?',
      type: 'radio',
      options: [
        'Poniżej 2 godzin',
        '2-5 godzin',
        '5-10 godzin',
        '10-20 godzin',
        'Powyżej 20 godzin'
      ]
    },
    {
      id: 'recommendation_likelihood',
      title: 'Jak prawdopodobne jest, że poleciłbyś taką platformę innym zarządcom? (1-10)',
      type: 'slider',
      min: 1,
      max: 10,
      step: 1
    },
    {
      id: 'additional_comments',
      title: 'Dodatkowe uwagi lub sugestie',
      type: 'textarea',
      placeholder: 'Podziel się swoimi przemyśleniami...'
    }
  ];

  // Pytania dla wykonawców
  const contractorQuestions = [
    {
      id: 'current_challenges',
      title: 'Jakie są Twoje największe wyzwania przy znajdowaniu zleceń?',
      type: 'checkbox',
      options: [
        'Konkurencja cenowa',
        'Trudność w dotarciu do potencjalnych klientów',
        'Długie procesy negocjacyjne',
        'Brak stałych zleceń',
        'Problemy z płatnościami',
        'Skomplikowane procedury przetargowe',
        'Ograniczony zasięg geograficzny'
      ]
    },
    {
      id: 'current_methods',
      title: 'Jak obecnie znajdujesz zlecenia?',
      type: 'checkbox',
      options: [
        'Rekomendacje od obecnych klientów',
        'Bezpośredni kontakt z zarządcami',
        'Platformy internetowe',
        'Lokalne ogłoszenia',
        'Media społecznościowe',
        'Strony internetowe wspólnot/spółdzielni',
        'Stowarzyszenia branżowe'
      ]
    },
    {
      id: 'monthly_revenue',
      title: 'Jaki jest Twój średni miesięczny przychód?',
      type: 'select',
      options: [
        'Poniżej 10 000 zł',
        '10 000 - 25 000 zł',
        '25 000 - 50 000 zł',
        '50 000 - 100 000 zł',
        'Powyżej 100 000 zł'
      ]
    },
    {
      id: 'service_categories',
      title: 'W jakich kategoriach świadczysz usługi?',
      type: 'checkbox',
      options: [
        'Utrzymanie czystości i zieleni',
        'Roboty remontowo-budowlane',
        'Utrzymanie techniczne i konserwacja',
        'Zarządzanie odpadami i recycling',
        'Ochrona i monitoring'
      ]
    },
    {
      id: 'pricing_willingness',
      title: 'Ile byłbyś skłonny płacić miesięcznie za dostęp do platformy ze zleceniami?',
      type: 'radio',
      options: [
        'Nic - tylko za prowizję od zleceń',
        'Do 25 zł',
        '25-50 zł',
        '50-100 zł',
        '100-200 zł',
        'Powyżej 200 zł'
      ]
    },
    {
      id: 'platform_features',
      title: 'Które funkcjonalności byłyby dla Ciebie najważniejsze?',
      type: 'checkbox',
      options: [
        'Łatwe składanie ofert',
        'Powiadomienia o nowych zleceniach',
        'System budowania reputacji',
        'Filtrowanie zleceń po lokalizacji',
        'Komunikacja z zarządcami',
        'Historia współpracy',
        'Narzędzia do zarządzania projektami'
      ]
    },
    {
      id: 'tender_participation',
      title: 'Jak często bierzesz udział w przetargach?',
      type: 'radio',
      options: [
        'Kilka razy w miesiącu',
        'Raz w miesiącu',
        'Kilka razy w roku',
        'Rzadko',
        'Nigdy'
      ]
    },
    {
      id: 'business_growth',
      title: 'O ile chciałbyś zwiększyć liczbę zleceń? (w %)',
      type: 'slider',
      min: 0,
      max: 200,
      step: 10
    },
    {
      id: 'payment_preference',
      title: 'Który model płatności preferowałbyś?',
      type: 'radio',
      options: [
        'Stały abonament miesięczny',
        'Prowizja od każdego zdobytego zlecenia',
        'Płatność za kontakt z zarządcą',
        'Model mieszany (abonament + prowizja)'
      ]
    },
    {
      id: 'time_spent',
      title: 'Ile czasu tygodniowo poświęcasz na poszukiwanie nowych zleceń?',
      type: 'radio',
      options: [
        'Poniżej 2 godzin',
        '2-5 godzin',
        '5-10 godzin',
        '10-20 godzin',
        'Powyżej 20 godzin'
      ]
    },
    {
      id: 'success_rate',
      title: 'Jaki procent Twoich ofert kończy się zleceniem?',
      type: 'slider',
      min: 0,
      max: 100,
      step: 5
    },
    {
      id: 'recommendation_likelihood',
      title: 'Jak prawdopodobne jest, że poleciłbyś taką platformę innym wykonawcom? (1-10)',
      type: 'slider',
      min: 1,
      max: 10,
      step: 1
    },
    {
      id: 'additional_comments',
      title: 'Dodatkowe uwagi lub sugestie',
      type: 'textarea',
      placeholder: 'Podziel się swoimi przemyśleniami...'
    }
  ];

  const questions = userType === 'manager' ? managerQuestions : contractorQuestions;
  const totalSteps = questions.length + 2; // +2 for user type selection and personal info
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const finalData = {
      ...surveyData,
      userType,
      submittedAt: new Date().toISOString()
    };
    onComplete(finalData);
  };

  const renderQuestion = (question: any) => {
    switch (question.type) {
      case 'radio':
        return (
          <RadioGroup
            value={surveyData.responses[question.id] || ''}
            onValueChange={(value) => updateResponse(question.id, value)}
          >
            {question.options.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        const selectedOptions = surveyData.responses[question.id] || [];
        return (
          <div className="space-y-3">
            {question.options.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedOptions.includes(option)}
                  onCheckedChange={(checked) => {
                    const newOptions = checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((item: string) => item !== option);
                    updateResponse(question.id, newOptions);
                  }}
                />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'select':
        return (
          <Select
            value={surveyData.responses[question.id] || ''}
            onValueChange={(value) => updateResponse(question.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wybierz opcję..." />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'slider':
        const value = surveyData.responses[question.id] || [question.min || 0];
        return (
          <div className="space-y-4">
            <Slider
              value={Array.isArray(value) ? value : [value]}
              onValueChange={(newValue) => updateResponse(question.id, newValue[0])}
              max={question.max}
              min={question.min}
              step={question.step}
              className="w-full"
            />
            <div className="text-center">
              <Badge variant="outline">
                Wartość: {Array.isArray(value) ? value[0] : value}
                {question.id === 'business_growth' && '%'}
              </Badge>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <Textarea
            placeholder={question.placeholder}
            value={surveyData.responses[question.id] || ''}
            onChange={(e) => updateResponse(question.id, e.target.value)}
            rows={4}
          />
        );

      case 'ranking':
        // Simplified ranking - would need more complex implementation
        return (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Zaznacz najważniejsze czynniki (możesz wybrać kilka):</p>
            <div className="space-y-3">
              {question.options.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={option}
                    checked={(surveyData.responses[question.id] || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const current = surveyData.responses[question.id] || [];
                      const updated = checked
                        ? [...current, option]
                        : current.filter((item: string) => item !== option);
                      updateResponse(question.id, updated);
                    }}
                  />
                  <Label htmlFor={option}>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">U</span>
            </div>
            <h1 className="text-2xl font-bold text-primary">Urbi.eu</h1>
          </div>
          <p className="text-gray-600">
            Ankieta walidacyjna - pomóż nam stworzyć lepszą platformę dla branży nieruchomości
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Krok {currentStep + 1} z {totalSteps}</span>
            <span>{Math.round(progress)}% ukończone</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <Card>
          <CardContent className="p-6">
            {/* User Type Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Kim jesteś?</h2>
                  <p className="text-gray-600">Wybierz opcję, która najlepiej Cię opisuje</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${
                      userType === 'manager' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setUserType('manager');
                      setSurveyData(prev => ({ ...prev, userType: 'manager' }));
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-2">Zarządca Nieruchomości</h3>
                      <p className="text-sm text-gray-600">
                        Zarządzam wspólnotą mieszkaniową, spółdzielnią lub pracuję w firmie zarządzającej nieruchomościami
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${
                      userType === 'contractor' 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setUserType('contractor');
                      setSurveyData(prev => ({ ...prev, userType: 'contractor' }));
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                      <h3 className="font-semibold mb-2">Wykonawca</h3>
                      <p className="text-sm text-gray-600">
                        Prowadzę firmę świadczącą usługi dla wspólnot mieszkaniowych i zarządców nieruchomości
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Informacje o Tobie</h2>
                  <p className="text-gray-600">Podaj podstawowe informacje (opcjonalnie, ale pomaga w analizie wyników)</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Imię i nazwisko</Label>
                    <Input
                      id="name"
                      value={surveyData.personalInfo.name}
                      onChange={(e) => updatePersonalInfo('name', e.target.value)}
                      placeholder="Jan Kowalski"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={surveyData.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      placeholder="jan@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={surveyData.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="+48 123 456 789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Nazwa firmy/organizacji</Label>
                    <Input
                      id="company"
                      value={surveyData.personalInfo.company}
                      onChange={(e) => updatePersonalInfo('company', e.target.value)}
                      placeholder="Nazwa firmy"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Stanowisko</Label>
                    <Input
                      id="position"
                      value={surveyData.personalInfo.position}
                      onChange={(e) => updatePersonalInfo('position', e.target.value)}
                      placeholder="Zarządca / Prezes / Właściciel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Staż pracy (lata)</Label>
                    <Input
                      id="experience"
                      value={surveyData.personalInfo.experience}
                      onChange={(e) => updatePersonalInfo('experience', e.target.value)}
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Survey Questions */}
            {currentStep > 1 && questions[currentStep - 2] && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">
                      Pytanie {currentStep - 1} z {questions.length}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-semibold mb-4">
                    {questions[currentStep - 2].title}
                  </h2>
                </div>
                
                {renderQuestion(questions[currentStep - 2])}
              </div>
            )}

            {/* Summary */}
            {currentStep === totalSteps - 1 && (
              <div className="space-y-6 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">Dziękujemy za wypełnienie ankiety!</h2>
                  <p className="text-gray-600 mb-4">
                    Twoje odpowiedzi pomogą nam stworzyć platformę, która rzeczywiście rozwiąże problemy branży nieruchomości.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Co dalej?</strong> Skontaktujemy się z Tobą, gdy platforma będzie gotowa do testów. 
                      Jako uczestnik ankiety otrzymasz darmowy dostęp do wersji beta!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              {onBack && currentStep === 0 ? (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Wróć
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Poprzednie
                </Button>
              )}

              {currentStep === totalSteps - 1 ? (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Wyślij ankietę
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 0 && !userType}
                >
                  Następne
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Ankieta prowadzona przez zespół Urbi.eu • 
            Czas wypełnienia: ~5-7 minut
          </p>
        </div>
      </div>
    </div>
  );
}