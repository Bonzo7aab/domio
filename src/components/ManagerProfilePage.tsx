"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Star, Building, Phone, Mail, Award, ExternalLink, TrendingUp, FileText, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { fetchManagerById } from '../lib/database/managers';
import { mockManagerDetailsMap } from '../mocks';
import { getCategoryLabel } from './contractor-dashboard/shared/utils';

interface ManagerProfilePageProps {
  managerId: string;
  onBack?: () => void;
}

// Convert detailed manager profile to page format
const convertManagerToPageFormat = (manager: any) => {
  if (!manager) return null;

  // Get rating breakdown from manager rating data
  const ratingBreakdown = manager.rating?.ratingBreakdown || (() => {
    // Calculate breakdown from reviews if not available
    const breakdown = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    if (manager.reviews && manager.reviews.length > 0) {
      manager.reviews.forEach((review: any) => {
        const rating = Math.floor(review.rating);
        if (rating >= 1 && rating <= 5) {
          breakdown[rating.toString() as keyof typeof breakdown]++;
        }
      });
    }
    return breakdown;
  })();

  return {
    name: manager.name,
    logo: manager.avatar || '/api/placeholder/150/150',
    coverImage: manager.coverImage || '/api/placeholder/800/300',
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
      id: review.id,
      author: review.author,
      authorCompany: review.authorCompany,
      rating: review.rating,
      title: review.title || '',
      text: review.comment,
      date: review.date,
      property: review.project,
      categories: review.categories || (review.categories ? {
        paymentTimeliness: review.categories.payment_timeliness,
        communication: review.categories.communication,
        projectClarity: review.categories.project_clarity,
        professionalism: review.categories.professionalism
      } : {})
    })) || [],
    ratingSummary: {
      averageRating: manager.rating?.overall || 0,
      totalReviews: manager.rating?.reviewsCount || 0,
      ratingBreakdown: ratingBreakdown,
      categoryRatings: {
        paymentTimeliness: manager.rating?.categories?.paymentTimeliness || 0,
        communication: manager.rating?.categories?.communication || 0,
        projectClarity: manager.rating?.categories?.projectClarity || 0,
        professionalism: manager.rating?.categories?.professionalism || 0
      }
    },
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

  useEffect(() => {
    async function loadManager() {
      try {
        setLoading(true);
        const data = await fetchManagerById(managerId);
        if (data) {
          setManager(convertManagerToPageFormat(data));
          setError(null);
        } else {
          const fallbackManager = mockManagerDetailsMap[managerId];
          if (fallbackManager) {
            setManager(fallbackManager);
            setError(null);
          } else {
            setError('Nie udało się załadować profilu zarządcy');
          }
        }
      } catch (err) {
        console.error('Error loading manager:', err);
        const fallbackManager = mockManagerDetailsMap[managerId];
        if (fallbackManager) {
          setManager(fallbackManager);
          setError(null);
        } else {
          setError('Nie udało się załadować profilu zarządcy');
        }
      } finally {
        setLoading(false);
      }
    }
    loadManager();
  }, [managerId]);

  // Sync active tab with hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#overview' || hash === '') {
        setActiveTab('overview');
      } else if (hash === '#services') {
        setActiveTab('services');
      } else if (hash === '#properties') {
        setActiveTab('properties');
      } else if (hash === '#team') {
        setActiveTab('team');
      } else if (hash === '#reviews') {
        setActiveTab('reviews');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-2 text-sm text-muted-foreground">Ładowanie profilu...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !manager) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{error || 'Zarządca nie znaleziony'}</h2>
            {onBack && <Button onClick={onBack}>Powrót do listy</Button>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div id="overview" className="scroll-mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* About */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Company Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">O firmie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                      {manager.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Key Statistics */}
                <div>
                  <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900">Kluczowe statystyki</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Buildings Stat */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Zarządzanych budynków</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-primary">{manager.stats.propertiesManaged}</div>
                      </CardContent>
                    </Card>

                    {/* Units Stat */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Zarządzanych lokali</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-primary">{manager.stats.unitsManaged}</div>
                      </CardContent>
                    </Card>

                    {/* Experience Stat */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Lat doświadczenia</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-primary">{manager.stats.yearsExperience}</div>
                      </CardContent>
                    </Card>

                    {/* Client Retention Stat */}
                    <Card className="hover:shadow-md transition-shadow bg-green-50/50 border-green-200">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Zadowolonych klientów</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl sm:text-3xl font-bold text-green-700">{manager.stats.clientRetention}%</div>
                      </CardContent>
                    </Card>

                    {/* Response Time Stat */}
                    {manager.stats.avgResponseTime && (
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xs sm:text-sm font-medium">Średni czas odpowiedzi</CardTitle>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg sm:text-xl font-bold text-primary">{manager.stats.avgResponseTime}</div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Achievements */}
                {manager.achievements && manager.achievements.length > 0 && (
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900">Osiągnięcia i nagrody</h3>
                    <Card>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="space-y-2 sm:space-y-3">
                          {manager.achievements.map((achievement: any, index: number) => (
                            <div key={index} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-xs sm:text-sm text-yellow-900 mb-1">{achievement.title}</div>
                                <div className="text-xs sm:text-sm text-yellow-700">{achievement.description}</div>
                                <div className="text-xs text-yellow-600 mt-1">{achievement.year}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Certificates */}
                {manager.certificates && manager.certificates.length > 0 && (
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 text-gray-900">Licencje i certyfikaty</h3>
                    <Card>
                      <CardContent className="pt-4 sm:pt-6">
                        <div className="flex flex-wrap gap-2">
                          {manager.certificates.map((cert: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 text-xs py-1.5 px-3">
                              <Award className="w-3 h-3 mr-1.5" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <Card className="h-fit self-start">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Kontakt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {manager.phone && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{manager.phone}</div>
                        <div className="text-xs sm:text-sm text-gray-500">Telefon</div>
                      </div>
                    </div>
                  )}
                  
                  {manager.email && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{manager.email}</div>
                        <div className="text-xs sm:text-sm text-gray-500">Email</div>
                      </div>
                    </div>
                  )}
                  
                  {manager.address && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{manager.address}</div>
                        <div className="text-xs sm:text-sm text-gray-500">Adres</div>
                      </div>
                    </div>
                  )}
                  
                  {manager.website && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{manager.website}</div>
                        <div className="text-xs sm:text-sm text-gray-500">Strona internetowa</div>
                      </div>
                    </div>
                  )}

                  <Button className="w-full mt-3 sm:mt-4 text-sm sm:text-base">
                    Zapytaj o współpracę
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div id="services" className="scroll-mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {manager.services.map((service: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                      {index === 0 && <Building className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {index === 1 && <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                      {index === 2 && <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
                      <span>{service.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3 sm:mb-4 text-sm">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold text-green-600">{service.price}</span>
                      <Button size="sm" className="text-xs sm:text-sm">Zapytaj</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div id="properties" className="scroll-mt-4">
            {manager.managedProperties && manager.managedProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {manager.managedProperties.map((property: any, index: number) => (
                  <Card key={index}>
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                      <img 
                        src={property.image} 
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="text-sm sm:text-base">{property.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{property.location}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                        <div>
                          <div className="font-bold text-base sm:text-lg">{property.buildings}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Budynków</div>
                        </div>
                        <div>
                          <div className="font-bold text-base sm:text-lg">{property.units}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Lokali</div>
                        </div>
                        <div>
                          <div className="font-bold text-base sm:text-lg">{property.since}</div>
                          <div className="text-xs sm:text-sm text-gray-600">Od roku</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Building className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">Brak zarejestrowanych nieruchomości</h3>
                  <p className="text-sm sm:text-base text-gray-600">Ten zarządca nie posiada jeszcze zarejestrowanych nieruchomości w portfolio.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div id="team" className="scroll-mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {manager.team.map((member: any, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-4 sm:pt-6 text-center">
                    <Avatar className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium mb-1 text-sm sm:text-base">{member.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">{member.position}</p>
                    <Badge variant="secondary" className="mb-2 text-xs">{member.experience}</Badge>
                    <div className="text-xs text-gray-500">{member.license}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div id="reviews" className="scroll-mt-4">
            <div className="space-y-4 sm:space-y-6">
              {/* Rating Summary */}
              {manager.ratingSummary && manager.ratingSummary.totalReviews > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      Podsumowanie ocen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary mb-2">
                          {manager.ratingSummary.averageRating.toFixed(1)}
                        </div>
                        <div className="flex justify-center mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-6 h-6 ${
                                i < Math.floor(manager.ratingSummary.averageRating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <div className="text-sm text-gray-600">
                          {manager.ratingSummary.totalReviews} {manager.ratingSummary.totalReviews === 1 ? 'opinia' : 'opinii'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {Object.entries(manager.ratingSummary.categoryRatings || {}).map(([category, rating]) => {
                          if (Number(rating) === 0) return null;
                          return (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{getCategoryLabel(category)}:</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-400 h-2 rounded-full" 
                                    style={{ width: `${(Number(rating) / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{Number(rating).toFixed(1)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {Object.keys(manager.ratingSummary.ratingBreakdown || {}).length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <div className="text-sm font-semibold mb-3">Rozkład ocen:</div>
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count = manager.ratingSummary.ratingBreakdown[stars.toString() as keyof typeof manager.ratingSummary.ratingBreakdown] || 0;
                            const percentage = manager.ratingSummary.totalReviews > 0 
                              ? (count / manager.ratingSummary.totalReviews) * 100 
                              : 0;
                            return (
                              <div key={stars} className="flex items-center gap-2">
                                <span className="text-sm w-8">{stars}★</span>
                                <Progress value={percentage} className="flex-1 h-2" />
                                <span className="text-sm text-gray-500 w-12 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {manager.reviews && manager.reviews.length > 0 ? (
                  manager.reviews.map((review: any) => (
                    <Card key={review.id || review.date}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-medium">{review.author}</h4>
                            <p className="text-sm text-gray-600">
                              {review.authorCompany || (review.property ? review.property : 'Klient')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${
                                  i < review.rating 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        
                        {review.title && (
                          <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                        )}
                        
                        <p className="text-gray-700 mb-3">{review.text}</p>
                        
                        {/* Category Ratings */}
                        {review.categories && Object.keys(review.categories).length > 0 && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium mb-2">Szczegółowe oceny:</div>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(review.categories).map(([category, rating]) => (
                                <div key={category} className="flex items-center justify-between text-xs">
                                  <span>{getCategoryLabel(category)}:</span>
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span>{Number(rating).toFixed(1)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{new Date(review.date).toLocaleDateString('pl-PL')}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-gray-500 mb-4">
                        <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">Brak opinii</h3>
                        <p>Ten zarządca nie ma jeszcze żadnych opinii od klientów.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}