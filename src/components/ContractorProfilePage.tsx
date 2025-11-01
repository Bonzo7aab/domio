"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Star, Shield, CheckCircle, Users, Briefcase, Phone, Mail, Calendar, Award, Eye, Heart, Share2, ExternalLink, ThumbsUp } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { fetchContractorById, fetchContractorReviews, fetchContractorRatingSummary, fetchContractorPortfolio } from '../lib/database/contractors';
import { createClient } from '../lib/supabase/client';
import { QuoteRequestModal } from './QuoteRequestModal';
import { mockContractorDetailsMap } from '../mocks';

interface ContractorProfilePageProps {
  contractorId: string;
  onBack?: () => void;
}

// Convert detailed contractor profile to page format
const convertContractorToPageFormat = (contractor: any) => {
  if (!contractor) return null;

  return {
    name: contractor.companyName,
    logo: contractor.avatar || '/api/placeholder/150/150',
    coverImage: contractor.coverImage || '/api/placeholder/800/300',
    slogan: contractor.services.specializations[0] || 'Profesjonalne usługi budowlane',
    description: `${contractor.companyName} działa na rynku od ${contractor.businessInfo.yearEstablished} roku. Specjalizujemy się w ${contractor.services.primary.join(', ').toLowerCase()}. Posiadamy ${contractor.experience.completedProjects} zakończonych projektów i średnią ocenę ${contractor.rating.overall} gwiazdek.`,
    location: contractor.location.city,
    rating: contractor.rating.overall,
    reviewCount: contractor.rating.reviewsCount,
    completedJobs: contractor.experience.completedProjects,
    verified: contractor.verification.status === 'verified',
    hasInsurance: contractor.insurance.hasOC,
    isPremium: contractor.plan === 'pro',
    founded: contractor.businessInfo.yearEstablished,
    employees: contractor.businessInfo.employeeCount,
    website: contractor.contactInfo.website || 'www.example.com',
    phone: contractor.contactInfo.phone,
    email: contractor.contactInfo.email,
    address: contractor.contactInfo.address,
    specialties: [...contractor.services.primary, ...contractor.services.secondary].slice(0, 5),
    certificates: contractor.experience.certifications,
    services: contractor.services.primary.map((service, index) => ({
      name: service,
      description: `Profesjonalne ${service.toLowerCase()} z gwarancją jakości`,
      price: contractor.pricing.hourlyRate ? 
        `${contractor.pricing.hourlyRate.min}-${contractor.pricing.hourlyRate.max} zł/h` : 
        'Wycena indywidualna'
    })),
    portfolio: contractor.portfolio.featuredProjects.map(project => ({
      title: project.title,
      image: project.images[0] || '/api/placeholder/400/300',
      description: project.description,
      date: project.year.toString()
    })),
    team: [
      {
        name: contractor.name,
        position: 'Właściciel/Kierownik',
        image: contractor.avatar || '/api/placeholder/150/150',
        experience: `${contractor.experience.yearsInBusiness} lat doświadczenia`
      }
    ],
    reviews: contractor.reviews.map(review => ({
      author: review.author,
      rating: review.rating,
      text: review.comment,
      date: review.date,
      project: review.project
    })),
    stats: {
      projectsCompleted: contractor.experience.completedProjects,
      clientSatisfaction: contractor.stats.onTimeCompletion,
      repeatClients: contractor.stats.rehireRate,
      avgResponseTime: contractor.stats.responseTime
    }
  };
};

export default function ContractorProfilePage({ contractorId, onBack }: ContractorProfilePageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [contractor, setContractor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingSummary, setRatingSummary] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  useEffect(() => {
    async function loadContractor() {
      try {
        const supabase = createClient();
        const contractorData = await fetchContractorById(contractorId);
        
        if (contractorData) {
          const formattedContractor = convertContractorToPageFormat(contractorData);
          setContractor(formattedContractor);
        } else {
          const fallbackContractor = mockContractorDetailsMap[contractorId];
          if (fallbackContractor) {
            setContractor(fallbackContractor);
            setReviews(
              fallbackContractor.reviews.map(review => ({
                reviewerName: review.author,
                reviewerType: 'manager',
                rating: review.rating,
                title: review.project,
                comment: review.text,
                categories: {},
                createdAt: review.date
              }))
            );
            setRatingSummary({
              averageRating: fallbackContractor.rating,
              totalReviews: fallbackContractor.reviewCount,
              categoryRatings: {
                profesjonalizm: fallbackContractor.rating,
                terminowość: fallbackContractor.rating,
                komunikacja: fallbackContractor.rating
              }
            });
            setPortfolio(
              fallbackContractor.portfolio.map((project, index) => ({
                id: `mock-portfolio-${index}`,
                title: project.title,
                description: project.description,
                images: [project.image],
                year: project.date,
                category: undefined,
                isFeatured: index === 0,
                location: fallbackContractor.address,
                budget: undefined,
                duration: undefined,
                clientFeedback: undefined,
                clientName: undefined
              }))
            );
          }
        }
      } catch (error) {
        console.error('Error loading contractor:', error);
        const fallbackContractor = mockContractorDetailsMap[contractorId];
        if (fallbackContractor) {
          setContractor(fallbackContractor);
          setReviews(
            fallbackContractor.reviews.map(review => ({
              reviewerName: review.author,
              reviewerType: 'manager',
              rating: review.rating,
              title: review.project,
              comment: review.text,
              categories: {},
              createdAt: review.date
            }))
          );
          setRatingSummary({
            averageRating: fallbackContractor.rating,
            totalReviews: fallbackContractor.reviewCount,
            categoryRatings: {
              profesjonalizm: fallbackContractor.rating,
              terminowość: fallbackContractor.rating,
              komunikacja: fallbackContractor.rating
            }
          });
          setPortfolio(
            fallbackContractor.portfolio.map((project, index) => ({
              id: `mock-portfolio-${index}`,
              title: project.title,
              description: project.description,
              images: [project.image],
              year: project.date,
              category: undefined,
              isFeatured: index === 0,
              location: fallbackContractor.address,
              budget: undefined,
              duration: undefined,
              clientFeedback: undefined,
              clientName: undefined
            }))
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadContractor();
  }, [contractorId]);

  // Load reviews when reviews tab is selected
  useEffect(() => {
    async function loadReviews() {
      if (activeTab === 'reviews' && contractorId && !reviews.length) {
        setReviewsLoading(true);
        try {
          const [reviewsData, ratingData] = await Promise.all([
            fetchContractorReviews(contractorId, 20), // Load more reviews for profile page
            fetchContractorRatingSummary(contractorId)
          ]);
          setReviews(reviewsData);
          setRatingSummary(ratingData);
        } catch (error) {
          console.error('Error loading reviews:', error);
        } finally {
          setReviewsLoading(false);
        }
      }
    }

    loadReviews();
  }, [activeTab, contractorId, reviews.length]);

  // Load portfolio when portfolio tab is selected
  useEffect(() => {
    async function loadPortfolio() {
      if (activeTab === 'portfolio' && contractorId && !portfolio.length) {
        setPortfolioLoading(true);
        try {
          const portfolioData = await fetchContractorPortfolio(contractorId);
          setPortfolio(portfolioData);
        } catch (error) {
          console.error('Error loading portfolio:', error);
        } finally {
          setPortfolioLoading(false);
        }
      }
    }

    loadPortfolio();
  }, [activeTab, contractorId, portfolio.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ładowanie profilu...</h2>
        </div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Wykonawca nie znaleziony</h2>
          <Button onClick={onBack}>Powrót do listy</Button>
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
                <span>Wykonawcy</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">{contractor.name}</span>
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
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-blue-800">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${contractor.coverImage})` }}
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
                  <AvatarImage src={contractor.logo} alt={contractor.name} />
                  <AvatarFallback className="text-3xl">{contractor.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{contractor.name}</h1>
                    <p className="text-xl text-gray-600 mb-4">{contractor.slogan}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{contractor.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Działa od {contractor.founded}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{contractor.employees} pracowników</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="font-bold text-lg">{contractor.rating}</span>
                        <span className="text-gray-500">({contractor.reviewCount} opinii)</span>
                      </div>
                      <Separator orientation="vertical" className="h-6" />
                      <div className="flex items-center space-x-1">
                        <Briefcase className="w-5 h-5 text-green-600" />
                        <span className="font-medium">{contractor.completedJobs} zleceń</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-3">
                    <Button 
                      size="lg" 
                      className="w-full md:w-auto"
                      onClick={() => setShowQuoteModal(true)}
                    >
                      Zapytaj o wycenę
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full md:w-auto"
                      onClick={() => setShowPhoneNumber(!showPhoneNumber)}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {showPhoneNumber ? 'Ukryj numer' : 'Zadzwoń'}
                    </Button>
                    {showPhoneNumber && (
                      <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <a 
                          href={`tel:${contractor.phone}`}
                          className="text-lg font-semibold text-green-800 hover:text-green-900 hover:underline block"
                        >
                          {contractor.phone}
                        </a>
                        <div className="text-sm text-green-600 mt-1">Kliknij numer, aby zadzwonić</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {contractor.verified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Zweryfikowany
                    </Badge>
                  )}
                  {contractor.hasInsurance && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Ubezpieczenie OC
                    </Badge>
                  )}
                  {contractor.isPremium && (
                    <Badge variant="default">Premium</Badge>
                  )}
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2">
                  {contractor.specialties.map((specialty, index) => (
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
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
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
                    {contractor.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{contractor.stats.projectsCompleted}</div>
                      <div className="text-sm text-gray-600">Zrealizowanych projektów</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{contractor.stats.clientSatisfaction}%</div>
                      <div className="text-sm text-gray-600">Zadowolonych klientów</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{contractor.stats.repeatClients}%</div>
                      <div className="text-sm text-gray-600">Powracających klientów</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{contractor.stats.avgResponseTime}</div>
                      <div className="text-sm text-gray-600">Średni czas odpowiedzi</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Certyfikaty i uprawnienia</h4>
                    <div className="flex flex-wrap gap-2">
                      {contractor.certificates.map((cert, index) => (
                        <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800">
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
                      <div className="font-medium">
                        {showPhoneNumber ? (
                          <a 
                            href={`tel:${contractor.phone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {contractor.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500">Kliknij "Zadzwoń" aby zobaczyć numer</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">Telefon</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{contractor.email}</div>
                      <div className="text-sm text-gray-500">Email</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{contractor.address}</div>
                      <div className="text-sm text-gray-500">Adres</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{contractor.website}</div>
                      <div className="text-sm text-gray-500">Strona internetowa</div>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    onClick={() => setShowQuoteModal(true)}
                  >
                    Zapytaj o wycenę
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contractor.services.map((service, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
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

          <TabsContent value="portfolio" className="space-y-6">
            {portfolioLoading ? (
              <div className="text-center py-8">
                <div className="text-lg">Ładowanie portfolio...</div>
              </div>
            ) : (
              <>
                {portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {portfolio.map((project) => (
                      <Card key={project.id} className="overflow-hidden">
                        <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                          {project.images.length > 0 ? (
                            <img 
                              src={project.images[0]} 
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <span className="text-gray-400">Brak zdjęcia</span>
                            </div>
                          )}
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{project.year}</Badge>
                            {project.category && (
                              <Badge variant="secondary">{project.category}</Badge>
                            )}
                            {project.isFeatured && (
                              <Badge variant="default">Wyróżniony</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-gray-600 text-sm">{project.description}</p>
                          
                          {project.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span>{project.location}</span>
                            </div>
                          )}
                          
                          {project.budget && (
                            <div className="text-sm">
                              <span className="font-medium text-green-600">{project.budget}</span>
                              {project.duration && (
                                <span className="text-gray-500 ml-2">• {project.duration}</span>
                              )}
                            </div>
                          )}
                          
                          {project.clientFeedback && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700 italic">"{project.clientFeedback}"</p>
                              {project.clientName && (
                                <p className="text-xs text-gray-500 mt-1">- {project.clientName}</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-gray-500 mb-4">
                        <Briefcase className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">Brak projektów w portfolio</h3>
                        <p>Ten wykonawca nie ma jeszcze żadnych projektów w swoim portfolio.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contractor.team.map((member, index) => (
                <Card key={index}>
                  <CardContent className="pt-6 text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium mb-1">{member.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{member.position}</p>
                    <Badge variant="secondary">{member.experience}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {reviewsLoading ? (
              <div className="text-center py-8">
                <div className="text-lg">Ładowanie opinii...</div>
              </div>
            ) : (
              <>
                {/* Rating Summary */}
                {ratingSummary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Podsumowanie ocen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-2">
                            {ratingSummary.averageRating.toFixed(1)}
                          </div>
                          <div className="flex justify-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-6 h-6 ${i < Math.floor(ratingSummary.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                          <div className="text-sm text-gray-600">
                            {ratingSummary.totalReviews} opinii
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {Object.entries(ratingSummary.categoryRatings || {}).map(([category, rating]) => (
                            <div key={category} className="flex items-center justify-between">
                              <span className="text-sm font-medium capitalize">{category}:</span>
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
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-medium">{review.reviewerName}</h4>
                              <p className="text-sm text-gray-600">
                                {review.reviewerType === 'manager' ? 'Zarządca' : 'Klient prywatny'}
                              </p>
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
                          
                          {review.title && (
                            <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                          )}
                          
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                          
                          {/* Category Ratings */}
                          {review.categories && Object.keys(review.categories).length > 0 && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm font-medium mb-2">Szczegółowe oceny:</div>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(review.categories).map(([category, rating]) => (
                                  <div key={category} className="flex items-center justify-between text-xs">
                                    <span className="capitalize">{category}:</span>
                                    <div className="flex items-center space-x-1">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                      <span>{Number(rating).toFixed(1)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{new Date(review.createdAt).toLocaleDateString('pl-PL')}</span>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="h-8 px-2">
                                <ThumbsUp className="w-3 h-3 mr-1" />
                                {review.helpfulCount}
                              </Button>
                            </div>
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
                          <p>Ten wykonawca nie ma jeszcze żadnych opinii od klientów.</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Quote Request Modal */}
      <QuoteRequestModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        contractorId={contractorId}
        contractorName={contractor?.name || ''}
      />
    </div>
  );
}