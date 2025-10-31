"use client";

import React, { useState } from 'react';
import { ArrowLeft, MapPin, Star, Shield, CheckCircle, Users, Building, Phone, Mail, Calendar, Award, Eye, Heart, Share2, ExternalLink, TrendingUp, FileText, Calculator } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { fetchManagerById } from '../lib/database/managers';

interface ManagerProfilePageProps {
  managerId: string;
  onBack?: () => void;
}

// Mock manager details data - rozszerzony profil
const mockManagerDetails = {
  '1': {
    name: 'ProManage Sp. z o.o.',
    logo: 'https://images.unsplash.com/photo-1558203728-00f45181dd84?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnQlMjBvZmZpY2V8ZW58MXx8fHwxNTc0MjA2MjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    coverImage: 'https://images.unsplash.com/photo-1680919838857-d54e011093d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZyUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzU3NDIxMzY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    slogan: 'Profesjonalne zarządzanie Twoją nieruchomością',
    description: 'ProManage to uznana firma zarządzająca nieruchomościami z 13-letnim doświadczeniem. Świadczymy kompleksowe usługi administracyjne dla wspólnot mieszkaniowych w Warszawie i okolicach.',
    location: 'Warszawa',
    rating: 4.8,
    reviewCount: 234,
    managedBuildings: 45,
    managedUnits: 1240,
    verified: true,
    hasInsurance: true,
    isPremium: true,
    founded: 2010,
    employees: '25-50',
    website: 'www.promanage.pl',
    phone: '+48 22 123 45 67',
    email: 'kontakt@promanage.pl',
    address: 'ul. Zarządzania 10, 00-001 Warszawa',
    specialties: ['Zarządzanie wspólnotami', 'Administracja nieruchomości', 'Obsługa prawna', 'Księgowość wspólnot', 'Nadzór remontów'],
    certificates: [
      'Licencja zarządcy nieruchomości',
      'ISO 9001:2015',
      'Certyfikat księgowy',
      'Ubezpieczenie OC zawodowe'
    ],
    services: [
      {
        name: 'Zarządzanie wspólnotą',
        description: 'Kompleksowe zarządzanie wspólnotą mieszkaniową',
        price: '8-12 zł/lokal/miesiąc'
      },
      {
        name: 'Obsługa prawna',
        description: 'Doradztwo prawne i reprezentacja w sądach',
        price: '300-500 zł/sprawę'
      },
      {
        name: 'Nadzór remontów',
        description: 'Profesjonalny nadzór nad inwestycjami wspólnoty',
        price: '5-8% wartości inwestycji'
      }
    ],
    managedProperties: [
      {
        name: 'Osiedle Zielona Dolina',
        image: 'https://images.unsplash.com/photo-1680919838857-d54e011093d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcGFydG1lbnQlMjBidWlsZGluZyUyMG1hbmFnZW1lbnR8ZW58MXx8fHwxNzU3NDIxMzY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        location: 'Warszawa, Mokotów',
        buildings: 8,
        units: 324,
        since: '2018'
      },
      {
        name: 'Kompleks Mieszkaniowy "Słoneczny"',
        image: 'https://images.unsplash.com/photo-1692133226337-55e513450a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnQlMjB0ZWFtJTIwb2ZmaWNlfGVufDF8fHx8MTc1NzQyMTM2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        location: 'Warszawa, Wilanów',
        buildings: 12,
        units: 456,
        since: '2020'
      }
    ],
    team: [
      {
        name: 'Katarzyna Wiśniewska',
        position: 'Zarządca nieruchomości',
        image: 'https://images.unsplash.com/photo-1692133226337-55e513450a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnQlMjB0ZWFtJTIwb2ZmaWNlfGVufDF8fHx8MTc1NzQyMTM2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        experience: '18 lat doświadczenia',
        license: 'Licencja nr 12345'
      },
      {
        name: 'Tomasz Kowalczyk',
        position: 'Specjalista ds. technicznych',
        image: 'https://images.unsplash.com/photo-1692133226337-55e513450a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9wZXJ0eSUyMG1hbmFnZW1lbnQlMjB0ZWFtJTIwb2ZmaWNlfGVufDF8fHx8MTc1NzQyMTM2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        experience: '12 lat doświadczenia',
        license: 'Uprawnienia budowlane'
      }
    ],
    reviews: [
      {
        author: 'WSM "Parkowa"',
        rating: 5,
        text: 'Profesjonalne zarządzanie naszą wspólnotą. Wszystkie sprawy załatwiane terminowo i rzetelnie.',
        date: '2024-03-10',
        property: 'Osiedle Zielona Dolina'
      },
      {
        author: 'Spółdzielnia "Nowy Świat"',
        rating: 5,
        text: 'Doskonała obsługa, transparentne rozliczenia i profesjonalna komunikacja.',
        date: '2024-02-28',
        property: 'Kompleks Słoneczny'
      }
    ],
    stats: {
      propertiesManaged: 45,
      unitsManaged: 1240,
      clientRetention: 92,
      avgResponseTime: '1h',
      yearsExperience: 13
    },
    achievements: [
      {
        title: 'Najlepszy Zarządca 2023',
        description: 'Nagroda Stowarzyszenia Zarządców Nieruchomości',
        year: '2023'
      },
      {
        title: 'Certyfikat ISO 9001',
        description: 'System zarządzania jakością',
        year: '2022'
      }
    ]
  }
};

// Convert detailed manager profile to page format
const convertManagerToPageFormat = (manager: any) => {
  if (!manager) return null;

  return {
    name: manager.name,
    logo: manager.avatar || '/api/placeholder/150/150',
    coverImage: manager.coverImage || '/api/placeholder/800/300',
    slogan: `${manager.organizationType === 'wspólnota' ? 'Profesjonalna wspólnota mieszkaniowa' : 
              manager.organizationType === 'spółdzielnia' ? 'Doświadczona spółdzielnia mieszkaniowa' :
              manager.organizationType === 'zarządca' ? 'Profesjonalne zarządzanie nieruchomościami' :
              manager.organizationType === 'deweloper' ? 'Zarządzanie deweloperskie najwyższej klasy' :
              manager.organizationType === 'tbs' ? 'Społeczne budownictwo mieszkaniowe' :
              'Administracja nieruchomości'}`,
    description: manager.description || `${manager.name} ${manager.organizationType === 'wspólnota' ? 'zarządza' : 'profesjonalnie zarządza'} ${manager.managedProperties?.buildingsCount || 0} budynkami z ${manager.managedProperties?.unitsCount || 0} lokalami. ${manager.experience?.yearsActive || 0} lat doświadczenia w branży nieruchomości zapewnia najwyższy standard obsługi.`,
    location: manager.location?.city || 'Warszawa',
    rating: manager.rating?.overall || 0,
    reviewCount: manager.rating?.reviewsCount || 0,
    managedBuildings: manager.managedProperties?.buildingsCount || 0,
    managedUnits: manager.managedProperties?.unitsCount || 0,
    verified: manager.verification?.status === 'verified' || false,
    hasInsurance: true,
    isPremium: manager.organizationType === 'deweloper' || manager.organizationType === 'zarządca' || manager.planType === 'premium',
    founded: manager.businessInfo?.yearEstablished || new Date().getFullYear(),
    employees: manager.employeeCount || (manager.organizationType === 'wspólnota' ? '5-15' : 
              manager.organizationType === 'spółdzielnia' ? '15-50' :
              manager.organizationType === 'zarządca' ? '25-100' :
              manager.organizationType === 'deweloper' ? '50-200' :
              '5-25'),
    website: manager.contactInfo?.website || 'www.example.com',
    phone: manager.contactInfo?.phone || '',
    email: manager.contactInfo?.email || '',
    address: manager.contactInfo?.address || '',
    specialties: manager.services?.primaryNeeds?.slice(0, 5) || [],
    certificates: manager.verification?.badges || [],
    services: [
      {
        name: manager.organizationType === 'wspólnota' ? 'Zarządzanie wspólnotą' : 
              manager.organizationType === 'spółdzielnia' ? 'Zarządzanie spółdzielnią' :
              'Zarządzanie nieruchomościami',
        description: `Kompleksowe zarządzanie ${manager.organizationType === 'wspólnota' ? 'wspólnotą mieszkaniową' : 
                     manager.organizationType === 'spółdzielnia' ? 'spółdzielnią mieszkaniową' :
                     'nieruchomościami'}`,
        price: manager.financials?.averageProjectBudget || 'Na zapytanie'
      },
      {
        name: 'Obsługa techniczna',
        description: 'Profesjonalna obsługa techniczna i konserwacja',
        price: manager.financials?.budgetPreferences || 'Na zapytanie'
      },
      {
        name: 'Zarządzanie projektami',
        description: 'Nadzór nad remontami i inwestycjami',
        price: manager.stats?.averageProjectDuration || 'Na zapytanie'
      }
    ],
    managedProperties: (manager.portfolio?.managedBuildings || []).map((building: any) => ({
      name: building.name,
      image: building.images?.[0] || '/api/placeholder/400/300',
      location: building.address,
      buildings: building.type === 'Bloki mieszkalne' ? 10 : 1,
      units: building.unitsCount,
      since: building.yearBuilt?.toString() || ''
    })),
    team: [
      {
        name: manager.contactInfo?.contactPerson || 'Zespół zarządzający',
        position: manager.contactInfo?.position || 'Zarządca nieruchomości',
        image: manager.avatar || '/api/placeholder/150/150',
        experience: `${manager.experience?.yearsActive || 0} lat doświadczenia`,
        license: manager.organizationType === 'zarządca' ? 'Licencja zarządcy nieruchomości' : 
                manager.organizationType === 'deweloper' ? 'Uprawnienia deweloperskie' :
                'Certyfikat zarządzania'
      }
    ],
    reviews: manager.reviews?.map((review: any) => ({
      author: review.author,
      rating: review.rating,
      text: review.comment,
      date: review.date,
      property: review.project
    })) || [],
    stats: {
      propertiesManaged: manager.managedProperties?.buildingsCount || 0,
      unitsManaged: manager.managedProperties?.unitsCount || 0,
      clientRetention: manager.stats?.contractorRetentionRate || 0,
      avgResponseTime: manager.stats?.averageResponseTime || '',
      yearsExperience: manager.experience?.yearsActive || 0
    },
    achievements: [
      {
        title: manager.verification?.badges?.[0] || 'Zweryfikowany zarządca',
        description: 'Potwierdzona wiarygodność i kompetencje',
        year: new Date().getFullYear().toString()
      },
      {
        title: `${manager.experience?.completedProjects || 0} zakończonych projektów`,
        description: 'Udane realizacje i zadowoleni klienci',
        year: new Date().getFullYear().toString()
      }
    ]
  };
};

export default function ManagerProfilePage({ managerId, onBack }: ManagerProfilePageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    async function loadManager() {
      try {
        setLoading(true);
        const data = await fetchManagerById(managerId);
        if (data) {
          setManager(convertManagerToPageFormat(data));
        }
        setError(null);
      } catch (err) {
        console.error('Error loading manager:', err);
        setError('Nie udało się załadować profilu zarządcy');
      } finally {
        setLoading(false);
      }
    }
    loadManager();
  }, [managerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  if (error || !manager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{error || 'Zarządca nie znaleziony'}</h2>
          {onBack && <Button onClick={onBack}>Powrót do listy</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <nav className="flex space-x-2 text-sm text-gray-500">
                <span>Zarządcy Nieruchomości</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">{manager.name}</span>
              </nav>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4 mr-2" />
                Obserwuj
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Udostępnij
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-green-600 to-blue-700">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${manager.coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-24 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
              {/* Logo */}
              <div className="flex-shrink-0 mb-6 md:mb-0">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={manager.logo} alt={manager.name} />
                  <AvatarFallback className="text-3xl">{manager.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{manager.name}</h1>
                    <p className="text-xl text-gray-600 mb-4">{manager.slogan}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{manager.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Działa od {manager.founded}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{manager.employees} pracowników</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-bold text-lg">{manager.rating}</span>
                        <span className="text-gray-500">({manager.reviewCount} opinii)</span>
                      </div>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center space-x-1">
                        <Building className="w-5 h-5 text-green-600" />
                        <span className="font-medium">{manager.managedBuildings} budynków</span>
                      </div>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center space-x-1">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">{manager.managedUnits} lokali</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <Button size="lg" className="w-full md:w-auto">
                      Zapytaj o współpracę
                    </Button>
                    <Button variant="outline" size="lg" className="w-full md:w-auto">
                      <Phone className="w-4 h-4 mr-2" />
                      Zadzwoń
                    </Button>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {manager.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Zweryfikowany
                    </Badge>
                  )}
                  {manager.hasInsurance && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Ubezpieczenie OC
                    </Badge>
                  )}
                  {manager.isPremium && (
                    <Badge variant="default">Premium</Badge>
                  )}
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2">
                  {manager.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="services">Usługi</TabsTrigger>
            <TabsTrigger value="properties">Nieruchomości</TabsTrigger>
            <TabsTrigger value="team">Zespół</TabsTrigger>
            <TabsTrigger value="reviews">Opinie</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* About */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>O firmie</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {manager.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{manager.stats.propertiesManaged}</div>
                      <div className="text-sm text-gray-600">Zarządzanych budynków</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{manager.stats.unitsManaged}</div>
                      <div className="text-sm text-gray-600">Zarządzanych lokali</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{manager.stats.clientRetention}%</div>
                      <div className="text-sm text-gray-600">Zadowolonych klientów</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{manager.stats.avgResponseTime}</div>
                      <div className="text-sm text-gray-600">Średni czas odpowiedzi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{manager.stats.yearsExperience}</div>
                      <div className="text-sm text-gray-600">lat doświadczenia</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Osiągnięcia i nagrody</h4>
                    <div className="space-y-3">
                      {manager.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <Award className="w-5 h-5 text-yellow-600" />
                          <div>
                            <div className="font-medium">{achievement.title}</div>
                            <div className="text-sm text-gray-600">{achievement.description} • {achievement.year}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Licencje i certyfikaty</h4>
                    <div className="flex flex-wrap gap-2">
                      {manager.certificates.map((cert, index) => (
                        <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                          <Award className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Kontakt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{manager.phone}</div>
                      <div className="text-sm text-gray-500">Telefon</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{manager.email}</div>
                      <div className="text-sm text-gray-500">Email</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{manager.address}</div>
                      <div className="text-sm text-gray-500">Adres</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{manager.website}</div>
                      <div className="text-sm text-gray-500">Strona internetowa</div>
                    </div>
                  </div>

                  <Button className="w-full mt-4">
                    Zapytaj o współpracę
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {manager.services.map((service, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {index === 0 && <Building className="w-5 h-5" />}
                      {index === 1 && <FileText className="w-5 h-5" />}
                      {index === 2 && <TrendingUp className="w-5 h-5" />}
                      <span>{service.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">{service.price}</span>
                      <Button size="sm">Zapytaj</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            {manager.managedProperties && manager.managedProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {manager.managedProperties.map((property, index) => (
                  <Card key={index}>
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <img 
                        src={property.image} 
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>{property.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{property.location}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div>
                          <div className="font-bold text-lg">{property.buildings}</div>
                          <div className="text-sm text-gray-600">Budynków</div>
                        </div>
                        <div>
                          <div className="font-bold text-lg">{property.units}</div>
                          <div className="text-sm text-gray-600">Lokali</div>
                        </div>
                        <div>
                          <div className="font-bold text-lg">{property.since}</div>
                          <div className="text-sm text-gray-600">Od roku</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Brak zarejestrowanych nieruchomości</h3>
                  <p className="text-gray-600">Ten zarządca nie posiada jeszcze zarejestrowanych nieruchomości w portfolio.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {manager.team.map((member, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium mb-1">{member.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{member.position}</p>
                    <Badge variant="secondary" className="mb-2">{member.experience}</Badge>
                    <div className="text-xs text-gray-500">{member.license}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="space-y-4">
              {manager.reviews.map((review, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-medium">{review.author}</h4>
                        <p className="text-sm text-gray-600">{review.property}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{review.text}</p>
                    <p className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('pl-PL')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}