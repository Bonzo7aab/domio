import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Shield, CheckCircle, MapPin, Phone, Mail, Briefcase, Users, Calendar, Award, ExternalLink, Heart, Share2, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { fetchContractorById, getTopRatedContractors, BrowseContractor } from '../../lib/database/contractors';
import { ContractorProfile } from '../../types/contractor';
import { QuoteRequestModal } from '../QuoteRequestModal';

interface MobileContractorProfilesProps {
  onBack: () => void;
  contractorId?: string;
}

export const MobileContractorProfiles: React.FC<MobileContractorProfilesProps> = ({
  onBack,
  contractorId
}) => {
  const [selectedContractorId, setSelectedContractorId] = useState(contractorId || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [contractor, setContractor] = useState<ContractorProfile | null>(null);
  const [topContractors, setTopContractors] = useState<BrowseContractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  // Load contractor details
  useEffect(() => {
    if (selectedContractorId) {
      const loadContractor = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await fetchContractorById(selectedContractorId);
          setContractor(data);
        } catch (err) {
          console.error('Error loading contractor:', err);
          setError('Nie udało się załadować profilu wykonawcy.');
        } finally {
          setLoading(false);
        }
      };

      loadContractor();
    }
  }, [selectedContractorId]);

  // Load top contractors for list view
  useEffect(() => {
    if (!selectedContractorId) {
      const loadTopContractors = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await getTopRatedContractors(10);
          setTopContractors(data);
        } catch (err) {
          console.error('Error loading top contractors:', err);
          setError('Nie udało się załadować listy wykonawców.');
        } finally {
          setLoading(false);
        }
      };

      loadTopContractors();
    }
  }, [selectedContractorId]);

  if (selectedContractorId) {
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Ładowanie profilu wykonawcy...</p>
          </div>
        </div>
      );
    }

    if (error || !contractor) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Wykonawca nie znaleziony</h2>
            <p className="text-gray-600 mb-4">{error || 'Profil wykonawcy nie został znaleziony.'}</p>
            <Button onClick={() => setSelectedContractorId(null)}>
              Powrót do listy
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedContractorId(null)}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold truncate">
                {contractor.companyName}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-r from-primary to-primary/80">
          {contractor.coverImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${contractor.coverImage})` }}
            />
          )}
        </div>

        {/* Profile Header */}
        <div className="relative -mt-16 mx-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                  <AvatarImage src={contractor.avatar} alt={contractor.companyName} />
                  <AvatarFallback className="text-lg font-bold">
                    {contractor.companyName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold line-clamp-1">
                    {contractor.companyName}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {contractor.services.specializations[0]}
                  </p>
                  
                  <div className="flex items-center space-x-3 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{contractor.location.city}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>od {contractor.businessInfo.yearEstablished}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{contractor.rating.overall}</span>
                      <span className="text-sm text-muted-foreground">
                        ({contractor.rating.reviewsCount})
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center space-x-1">
                      <Briefcase className="h-4 w-4 text-success" />
                      <span className="font-medium text-sm">{contractor.experience.completedProjects}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-2 mt-4">
                {contractor.verification.status === 'verified' && (
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Zweryfikowany
                  </Badge>
                )}
                {contractor.insurance.hasOC && (
                  <Badge variant="secondary" className="bg-info/10 text-info">
                    <Shield className="h-3 w-3 mr-1" />
                    Ubezpieczenie
                  </Badge>
                )}
                {contractor.plan === 'pro' && (
                  <Badge variant="default">Premium</Badge>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <Button 
                  className="flex-1"
                  onClick={() => setShowQuoteModal(true)}
                >
                  Zapytaj o wycenę
                </Button>
                <Button variant="outline" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <div className="px-4 mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">Profil</TabsTrigger>
              <TabsTrigger value="services" className="text-xs">Usługi</TabsTrigger>
              <TabsTrigger value="portfolio" className="text-xs">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs">Opinie</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Stats */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {contractor.experience.completedProjects}
                      </div>
                      <div className="text-xs text-muted-foreground">Projektów</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {contractor.stats.onTimeCompletion}%
                      </div>
                      <div className="text-xs text-muted-foreground">Na czas</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {contractor.stats.rehireRate}%
                      </div>
                      <div className="text-xs text-muted-foreground">Ponownych</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {contractor.stats.responseTime}
                      </div>
                      <div className="text-xs text-muted-foreground">Odpowiedź</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">O firmie</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {contractor.companyName} działa na rynku od {contractor.businessInfo.yearEstablished} roku. 
                    Specjalizujemy się w {contractor.services.primary.join(', ').toLowerCase()}. 
                    Posiadamy {contractor.experience.completedProjects} zakończonych projektów.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Specjalizacje</h4>
                      <div className="flex flex-wrap gap-1">
                        {contractor.services.specializations.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Certyfikaty</h4>
                      <div className="flex flex-wrap gap-1">
                        {contractor.experience.certifications.map((cert, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-warning/10 text-warning">
                            <Award className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kontakt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{contractor.contactInfo.phone}</div>
                      <div className="text-xs text-muted-foreground">Telefon</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{contractor.contactInfo.email}</div>
                      <div className="text-xs text-muted-foreground">Email</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{contractor.contactInfo.address}</div>
                      <div className="text-xs text-muted-foreground">Adres</div>
                    </div>
                  </div>
                  
                  {contractor.contactInfo.website && (
                    <div className="flex items-center space-x-3">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{contractor.contactInfo.website}</div>
                        <div className="text-xs text-muted-foreground">Strona</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-4 mt-4">
              {contractor.services.primary.map((service, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{service}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Profesjonalne {service.toLowerCase()} z gwarancją jakości
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-success">
                        {contractor.pricing.hourlyRate ? 
                          `${contractor.pricing.hourlyRate.min}-${contractor.pricing.hourlyRate.max} zł/h` : 
                          'Wycena indywidualna'
                        }
                      </span>
                      <Button size="sm">Zapytaj</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4 mt-4">
              {contractor.portfolio.featuredProjects.map((project, index) => (
                <Card key={index}>
                  <div className="aspect-video bg-muted rounded-t-lg">
                    <img 
                      src={project.images[0] || '/api/placeholder/400/200'} 
                      alt={project.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base line-clamp-1">{project.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">{project.year}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm font-medium text-success">{project.budget}</span>
                      <span className="text-xs text-muted-foreground">{project.duration}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-4">
              {contractor.reviews.map((review, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-sm">{review.author}</h4>
                        <p className="text-xs text-muted-foreground">{review.project}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-muted-foreground'}`} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-foreground mb-2 line-clamp-3">{review.comment}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                    {review.response && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Odpowiedź firmy:</p>
                        <p className="text-sm">{review.response}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom spacing */}
        <div className="pb-8" />
      </div>
    );
  }

  // List view - show all contractors
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-border px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Wykonawcy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold mb-2">Najlepiej oceniani</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Poznaj naszych zweryfikowanych wykonawców
            </p>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Ładowanie wykonawców...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Spróbuj ponownie
              </Button>
            </div>
          )}

          {!loading && !error && topContractors.map((contractor) => (
            <Card 
              key={contractor.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedContractorId(contractor.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={contractor.avatar_url} alt={contractor.name} />
                    <AvatarFallback>{contractor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <h3 className="font-medium text-sm line-clamp-1">
                          {contractor.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {contractor.primary_services.join(', ')}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs font-medium">{contractor.rating}</span>
                            <span className="text-xs text-muted-foreground">
                              ({contractor.review_count})
                            </span>
                          </div>
                          <Separator orientation="vertical" className="h-3" />
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {contractor.city}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        {contractor.is_verified && (
                          <Badge variant="secondary" className="bg-success/10 text-success text-xs px-2 py-0">
                            ✓
                          </Badge>
                        )}
                        {contractor.plan_type === 'pro' && (
                          <Badge variant="default" className="text-xs px-2 py-0">
                            PRO
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex flex-wrap gap-1">
                        {contractor.primary_services.slice(0, 2).map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                            {service}
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm" variant="outline">
                        Zobacz profil
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && !error && topContractors.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">Brak dostępnych wykonawców.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quote Request Modal */}
      {contractor && (
        <QuoteRequestModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          contractorId={contractor.id}
          contractorName={contractor.companyName}
        />
      )}
    </div>
  );
};