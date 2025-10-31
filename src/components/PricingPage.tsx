import React, { useState } from 'react';
import { ArrowLeft, Check, Star, Building2, Wrench, Users, TrendingUp, Clock, Award, Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface PricingPageProps {
  onBack: () => void;
  onContractorRegister: () => void;
  onManagerRegister: () => void;
  onExpertConsultation: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onContractorRegister, onManagerRegister, onExpertConsultation }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contractors' | 'managers'>('contractors');

  // Plany cenowe dla wykonawców
  const contractorPlans = [
    {
      name: 'Domio Basic',
      subtitle: 'Nowe zlecenia bez wysiłku. Buduj swój portfel klientów.',
      description: 'Idealny dla wykonawców, którzy szukają stałego strumienia zleceń od wiarygodnych klientów i chcą rozwijać swoją firmę',
      price: { monthly: 50, yearly: 500 },
      popular: true,
      benefits: [
        {
          title: 'Nieograniczony dostęp do zweryfikowanych przetargów',
          description: 'Koniec z "łowieniem" zleceń! Masz pewność, że każde zapytanie jest prawdziwe i od poważnego Zarządcy.'
        },
        {
          title: 'Możliwość składania ofert bez limitu',
          description: 'Zwiększasz swoje szanse na pozyskanie zlecenia, które idealnie pasuje do Twojej specjalizacji.'
        },
        {
          title: 'Profesjonalny profil w bazie Domio',
          description: 'Wyeksponuj swoje doświadczenie i usługi, by łatwo być znalezionym przez Zarządców.'
        },
        {
          title: 'Podstawowa weryfikacja firmy',
          description: 'Zbuduj zaufanie od samego początku, potwierdzając swoją rzetelność.'
        }
      ],
      mainBenefit: 'Otrzymujesz łatwy i efektywny dostęp do klientów, którzy aktywnie szukają Twoich usług, co przekłada się na stabilny wzrost Twojej firmy.',
      trial: '7 dni darmowego okresu próbnego'
    },
    {
      name: 'Domio Pro',
      subtitle: 'Zdobądź status eksperta. Pozyskuj najlepsze zlecenia z gwarancją jakości.',
      description: 'Dla doświadczonych wykonawców, którzy chcą wyróżnić się na tle konkurencji, zdobyć prestiż i dotrzeć do najbardziej lukratywnych zleceń',
      price: { monthly: 100, yearly: 1000 },
      popular: false,
      benefits: [
        {
          title: 'Wszystko z planu Domio Basic',
          description: 'Plus dodatkowe korzyści, które wyróżnią Cię na rynku.'
        },
        {
          title: 'Odznaka "Zweryfikowany Wykonawca" (status eksperta)',
          description: 'Twoja firma zyskuje najwyższy poziom zaufania, co zwiększa szansę na wybór spośród innych wykonawców.'
        },
        {
          title: 'Wyróżnienie profilu w wynikach wyszukiwania',
          description: 'Bądź zawsze na czele! Twoja oferta jest widoczna dla większej liczby Zarządców szukających sprawdzonych profesjonalistów.'
        },
        {
          title: 'Dostęp do szczegółowych statystyk rynkowych',
          description: 'Podejmuj świadome decyzje biznesowe, poznając trendy i oczekiwania rynku.'
        },
        {
          title: 'Priorytetowe powiadomienia o nowych zleceniach',
          description: 'Bądź pierwszy tam, gdzie są najlepsze okazje.'
        }
      ],
      mainBenefit: 'Twoja firma staje się pierwszym wyborem dla Zarządców, co gwarantuje Ci stały dostęp do najbardziej atrakcyjnych zleceń i buduje Twoją markę jako lidera w branży.',
      trial: '7 dni darmowego okresu próbnego'
    }
  ];

  // Plan dla zarządców/wspólnot
  const managerPlans = [
    {
      name: 'Domio Free',
      subtitle: 'Twój spokój i pewność, za 0 zł',
      description: 'Idealny dla każdego Zarządcy, który ceni sobie bezpieczeństwo i oszczędność czasu w zarządzaniu nieruchomościami',
      price: { monthly: 0, yearly: 0 },
      popular: true,
      benefits: [
        {
          title: 'Natychmiastowy dostęp do bazy zweryfikowanych Wykonawców',
          description: 'Koniec z szukaniem po omacku! W kilka minut znajdziesz profesjonalistów, którzy spełniają Twoje kryteria.'
        },
        {
          title: 'Wygodne dodawanie zleceń',
          description: 'Stwórz i opublikuj zapytanie ofertowe w intuicyjny sposób, oszczędzając cenny czas.'
        },
        {
          title: 'Bezpośrednia komunikacja na platformie',
          description: 'Wszystkie rozmowy i ustalenia w jednym miejscu – przejrzyście i bez nieporozumień.'
        },
        {
          title: 'Dostęp do wiarygodnych ocen i recenzji',
          description: 'Podejmuj decyzje o wyborze wykonawcy na podstawie opinii innych zarządców.'
        },
        {
          title: 'Pełny system przetargowy',
          description: 'Transparentna procedura wyboru wykonawcy z gwarancją najlepszej oferty.'
        }
      ],
      mainBenefit: 'Zyskujesz pełną kontrolę i transparentność w procesie wyboru firm, minimalizując ryzyko i oszczędzając swój czas.'
    }
  ];

  const formatPrice = (price: { monthly: number; yearly: number }) => {
    const amount = billingPeriod === 'monthly' ? price.monthly : price.yearly;
    const period = billingPeriod === 'monthly' ? 'miesiąc' : 'rok';
    
    if (amount === 0) return 'Darmowy';
    return `${amount} zł/${period}`;
  };

  const getSavings = (price: { monthly: number; yearly: number }) => {
    if (price.yearly === 0 || billingPeriod === 'monthly') return null;
    const monthlyCost = price.monthly * 12;
    const savings = monthlyCost - price.yearly;
    return `Oszczędzasz ${savings} zł (2 miesiące gratis!)`;
  };

  // FAQ Data
  const managerFAQ = [
    {
      id: 'free',
      question: 'Czy korzystanie z Domio jest płatne?',
      answer: 'Nie. Podstawowy dostęp do portalu, w tym dodawanie zleceń i przeglądanie ofert wykonawców, jest całkowicie bezpłatny. Zależy nam na tym, aby każdy Zarządca mógł łatwo i bezpiecznie znaleźć odpowiednią firmę do realizacji prac.'
    },
    {
      id: 'benefits',
      question: 'Jakie są Wasze główne korzyści dla zarządcy?',
      answer: 'Naszym celem jest zapewnienie Ci spokoju i pewności. Dzięki Domio zyskujesz dostęp do bazy zweryfikowanych firm, unikasz ryzykownych zleceń i oszczędzasz czas, który normalnie przeznaczasz na żmudne poszukiwania i weryfikację. Wszystko to w jednym, przejrzystym miejscu.'
    },
    {
      id: 'verification',
      question: 'Jak weryfikujecie wykonawców?',
      answer: 'Nasi Wykonawcy przechodzą proces weryfikacji, który obejmuje potwierdzenie danych firmy, uprawnień, a w przypadku planu Domio Pro również polis ubezpieczeniowych i dokumentacji. Dzięki temu masz pewność, że współpracujesz z rzetelnymi profesjonalistami.'
    }
  ];

  const contractorFAQ = [
    {
      id: 'platform',
      question: 'Czy Domio to kolejny portal z ogłoszeniami?',
      answer: 'Nie. Jesteśmy platformą stworzoną, aby pomóc Ci budować stabilną pozycję na rynku. Zamiast konkurować ceną w "wyścigu w dół", na Domio masz dostęp do zleceń od poważnych klientów (wspólnot i spółdzielni) i budujesz swoją wiarygodność poprzez system weryfikacji oraz oceny.'
    },
    {
      id: 'pro-verification',
      question: 'Na czym polega weryfikacja "Domio Pro"?',
      answer: 'Weryfikacja "Domio Pro" to unikalna wartość, która odróżnia Cię od konkurencji. Potwierdzamy Twoją rzetelność, dokumenty i uprawnienia, dzięki czemu zyskujesz Odznakę Zweryfikowanego Wykonawcy. To znak jakości, który przekonuje Zarządców do wyboru właśnie Twojej firmy.'
    },
    {
      id: 'steady-stream',
      question: 'Czy mogę liczyć na stały strumień zleceń?',
      answer: 'Naszym celem jest zapewnienie Ci efektywnego dostępu do klientów. Zarządcy aktywnie szukają firm do konkretnych, często cyklicznych prac. Dzięki naszemu portalowi, stajesz się widoczny dla tych klientów i możesz zyskać dostęp do stabilnych i lukratywnych zleceń, bez konieczności kosztownych działań marketingowych.'
    }
  ];

  // Social proof data
  const testimonials = [
    {
      name: 'Anna Kowalska',
      role: 'Zarządca wspólnoty, Warszawa',
      content: 'Dzięki Domio w końcu mogę spać spokojnie. Wszyscy wykonawcy są zweryfikowani, a system ocen pomaga mi wybierać najlepszych.',
      rating: 5
    },
    {
      name: 'Firma RemBud',
      role: 'Wykonawca, Kraków',
      content: 'Po roku korzystania z Domio nasze zlecenia wzrosły o 200%. Nie muszę już szukać klientów - oni sami się zgłaszają.',
      rating: 5
    },
    {
      name: 'Marek Nowak',
      role: 'Zarządca spółdzielni, Gdańsk',
      content: 'Proces wyboru wykonawcy skrócił się z tygodni do godzin. Transparentność i profesjonalizm na najwyższym poziomie.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Cennik Domio</h1>
              <p className="text-muted-foreground">Wybierz plan dopasowany do Twoich potrzeb</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-muted p-1 rounded-lg">
            <Button
              variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingPeriod('monthly')}
              className="px-6"
            >
              Miesięcznie
            </Button>
            <Button
              variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBillingPeriod('yearly')}
              className="px-6"
            >
              Rocznie
              <Badge variant="secondary" className="ml-2 bg-success text-success-foreground">
                2 miesiące gratis
              </Badge>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="contractors" className="w-full" onValueChange={(value) => setActiveTab(value as 'contractors' | 'managers')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="contractors" className="flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span>Wykonawcy</span>
            </TabsTrigger>
            <TabsTrigger value="managers" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>Zarządcy</span>
            </TabsTrigger>
          </TabsList>

          {/* Plany dla wykonawców */}
          <TabsContent value="contractors">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-bold mb-4 text-primary">Przestań szukać. Zacznij dostawać zlecenia</h2>
              <p className="text-xl text-muted-foreground mb-6 max-w-4xl mx-auto">
                Wyróżnij się w branży i zdobądź najlepszych klientów. Każde zlecenie to poważny zarządca, który rzeczywiście potrzebuje Twoich usług.
              </p>
              <div className="bg-gradient-to-r from-primary/10 to-warning/10 rounded-lg p-6 max-w-3xl mx-auto border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong>Gwarancja jakości:</strong> Pracujesz tylko z zweryfikowanymi zarządcami. Żadnych fałszywych ogłoszeń, żadnej utraty czasu na nierealne zlecenia.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
              {contractorPlans.map((plan, index) => (
                <Card key={index} className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-2 border-warning shadow-xl ring-4 ring-warning/20'} ${index === 1 ? 'lg:transform lg:scale-110' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        Najpopularniejszy
                      </Badge>
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-warning text-warning-foreground px-4 py-2 text-sm font-bold">
                        ⭐ ZALECANY
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-base font-semibold text-primary mt-2">{plan.subtitle}</div>
                    <CardDescription className="text-sm mt-3">{plan.description}</CardDescription>
                    <div className="mt-6">
                      <div className="text-4xl font-bold text-primary">
                        {formatPrice(plan.price)}
                      </div>
                      {getSavings(plan.price) && (
                        <div className="text-base text-success font-bold mt-2 bg-success/10 px-3 py-1 rounded-full inline-block">
                          {getSavings(plan.price)}
                        </div>
                      )}
                      {plan.trial && (
                        <div className="text-xs text-warning font-medium mt-1">
                          + {plan.trial}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-base">Co to dla Ciebie oznacza:</h4>
                      {plan.benefits.map((benefit, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-sm">{benefit.title}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gradient-to-r from-primary/10 to-success/10 rounded-lg p-4 border border-primary/20">
                      <h5 className="font-semibold mb-2 text-primary text-sm">Korzyść główna:</h5>
                      <p className="text-xs leading-relaxed font-medium">
                        {plan.mainBenefit}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full mt-6" 
                      variant={plan.popular ? 'default' : 'outline'} 
                      size="lg"
                      onClick={onContractorRegister}
                    >
                      {plan.trial ? 'Rozpocznij za darmo' : 'Wybierz plan'}
                    </Button>
                    
                    {plan.trial && (
                      <p className="text-xs text-center text-muted-foreground">
                        Bez zobowiązań • Anuluj w każdej chwili
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Plany dla zarządców */}
          <TabsContent value="managers">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-bold mb-4 text-primary">Znajdź zaufanego Wykonawcę i oszczędź swój czas</h2>
              <p className="text-xl text-muted-foreground mb-6 max-w-4xl mx-auto">
                Zarządzanie nieruchomościami nigdy nie było tak proste. Przestań tracić czas na szukanie wykonawców – 
                oni sami się do Ciebie zgłoszą z najlepszymi ofertami.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto mb-12">
              {managerPlans.map((plan, index) => (
                <Card key={index} className="relative border-primary shadow-lg">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-success text-success-foreground px-4 py-2">
                      Zawsze darmowy
                    </Badge>
                  </div>
                  
                  <CardHeader className="text-center pb-6 pt-8">
                    <CardTitle className="text-3xl">{plan.name}</CardTitle>
                    <div className="text-lg font-semibold text-primary mt-2">{plan.subtitle}</div>
                    <CardDescription className="text-base mt-3">{plan.description}</CardDescription>
                    <div className="mt-6">
                      <div className="text-5xl font-bold text-success">
                        {formatPrice(plan.price)}
                      </div>
                      <p className="text-muted-foreground mt-2">
                        Bez opłat miesięcznych • Bez ukrytych kosztów
                      </p>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div className="space-y-5">
                      <h4 className="font-semibold text-lg">Co to dla Ciebie oznacza:</h4>
                      {plan.benefits.map((benefit, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-start space-x-3">
                            <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-sm">{benefit.title}</div>
                              <div className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-gradient-to-r from-success/10 to-primary/10 rounded-lg p-6 border border-success/20">
                      <h5 className="font-semibold mb-3 text-primary">Korzyść główna:</h5>
                      <p className="text-sm leading-relaxed font-medium">
                        {plan.mainBenefit}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full mt-8" 
                      size="lg"
                      onClick={onManagerRegister}
                    >
                      Rozpocznij za darmo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>





        {/* Społeczny dowód słuszności */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Co mówią nasi użytkownicy</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Rzeczywiste opinie od zarządców i wykonawców, którzy już korzystają z Domio
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-center">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <CardDescription className="text-sm italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Najczęściej zadawane pytania</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Znajdź odpowiedzi na pytania, które nurtują innych użytkowników
            </p>
          </div>

          <Tabs defaultValue="managers-faq" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="managers-faq" className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>FAQ Zarządców</span>
              </TabsTrigger>
              <TabsTrigger value="contractors-faq" className="flex items-center space-x-2">
                <Wrench className="h-4 w-4" />
                <span>FAQ Wykonawców</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="managers-faq">
              <div className="space-y-4">
                {managerFAQ.map((faq) => (
                  <Collapsible key={faq.id} open={openFAQ === faq.id} onOpenChange={(open) => setOpenFAQ(open ? faq.id : null)}>
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-left text-base">{faq.question}</CardTitle>
                            {openFAQ === faq.id ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-6 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="contractors-faq">
              <div className="space-y-4">
                {contractorFAQ.map((faq) => (
                  <Collapsible key={faq.id} open={openFAQ === faq.id} onOpenChange={(open) => setOpenFAQ(open ? faq.id : null)}>
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-left text-base">{faq.question}</CardTitle>
                            {openFAQ === faq.id ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-6 pb-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Podsumowanie i CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Gotowy na zmianę swojego biznesu?</h2>
          <p className="text-lg text-muted-foreground mb-4 max-w-3xl mx-auto">
            Dołącz do tysięcy zarządców i wykonawców, którzy już odkryli, 
            jak łatwo i bezpiecznie można zarządzać nieruchomościami w XXI wieku
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rozpocznij za darmo już dziś i przekonaj się, dlaczego Domio to przyszłość branży nieruchomości w Polsce
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={onExpertConsultation}
            >
              <Users className="h-4 w-4 mr-2" />
              Porozmawiaj z ekspertem
            </Button>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-lg px-8 py-3"
              onClick={activeTab === 'contractors' ? onContractorRegister : onManagerRegister}
            >
              🚀 Rozpocznij za darmo już dziś
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-xs text-muted-foreground">
            <div className="flex items-center justify-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>Bez ukrytych kosztów</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>Anuluj w każdej chwili</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Check className="h-4 w-4 text-success" />
              <span>Pełne wsparcie 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;