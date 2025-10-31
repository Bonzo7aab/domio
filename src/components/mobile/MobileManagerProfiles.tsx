import React, { useState } from 'react';
import { ArrowLeft, Star, Shield, CheckCircle, MapPin, Phone, Mail, Building, Users, Calendar, Award, ExternalLink, Heart, Share2, TrendingUp, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { mockManagers, getManagerById, getTopRatedManagers } from '../../mocks';

interface MobileManagerProfilesProps {
  onBack: () => void;
  managerId?: string;
}

export const MobileManagerProfiles: React.FC<MobileManagerProfilesProps> = ({
  onBack,
  managerId
}) => {
  const [selectedManagerId, setSelectedManagerId] = useState(managerId || null);
  const [activeTab, setActiveTab] = useState('overview');

  if (selectedManagerId) {
    const manager = getManagerById(selectedManagerId);
    
    if (!manager) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Zarządca nie znaleziony</h2>
            <Button onClick={() => setSelectedManagerId(null)}>
              Powrót do listy
            </Button>
          </div>
        </div>
      );
    }

    const getOrganizationTypeLabel = (type: string) => {
      switch(type) {
        case 'wspólnota': return 'Wspólnota mieszkaniowa';
        case 'spółdzielnia': return 'Spółdzielnia mieszkaniowa';
        case 'zarządca': return 'Zarządca nieruchomości';
        case 'deweloper': return 'Deweloper';
        case 'tbs': return 'TBS';
        case 'administracja': return 'Administracja';
        default: return 'Organizacja';
      }
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="sticky top-0 z-50 bg-white border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedManagerId(null)}
                className="h-9 w-9"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold truncate">
                {manager.name}
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
        <div className="relative h-32 bg-gradient-to-r from-success to-info">
          {manager.coverImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${manager.coverImage})` }}
            />
          )}
        </div>

        {/* Profile Header */}
        <div className="relative -mt-16 mx-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
                  <AvatarImage src={manager.avatar} alt={manager.name} />
                  <AvatarFallback className="text-lg font-bold">
                    {manager.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold line-clamp-1">
                    {manager.name}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {getOrganizationTypeLabel(manager.organizationType)}
                  </p>
                  
                  <div className="flex items-center space-x-3 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{manager.location.city}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>od {manager.businessInfo.yearEstablished}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{manager.rating.overall}</span>
                      <span className="text-sm text-muted-foreground">
                        ({manager.rating.reviewsCount})
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4 text-info" />
                      <span className="font-medium text-sm">{manager.managedProperties.buildingsCount}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-success" />
                      <span className="font-medium text-sm">{manager.managedProperties.unitsCount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-2 mt-4">
                {manager.verification.status === 'verified' && (
                  <Badge variant="secondary" className="bg-success/10 text-success">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Zweryfikowany
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-info/10 text-info">
                  <Shield className="h-3 w-3 mr-1" />
                  Ubezpieczenie
                </Badge>
                {(manager.organizationType === 'deweloper' || manager.organizationType === 'zarządca') && (
                  <Badge variant="default">Premium</Badge>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <Button className="flex-1">
                  Zapytaj o współpracę
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
              <TabsTrigger value="properties" className="text-xs">Obiekty</TabsTrigger>
              <TabsTrigger value="services" className="text-xs">Usługi</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs">Opinie</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Stats */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {manager.managedProperties.buildingsCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Budynków</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {manager.managedProperties.unitsCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Lokali</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {manager.stats.paymentPunctuality}%
                      </div>
                      <div className="text-xs text-muted-foreground">Terminowość</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {manager.stats.averageResponseTime}
                      </div>
                      <div className="text-xs text-muted-foreground">Odpowiedź</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">O organizacji</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {manager.name} {manager.organizationType === 'wspólnota' ? 'zarządza' : 'profesjonalnie zarządza'} {manager.managedProperties.buildingsCount} budynkami 
                    z {manager.managedProperties.unitsCount} lokalami. {manager.experience.yearsActive} lat doświadczenia w branży nieruchomości.
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Główne potrzeby</h4>
                      <div className="flex flex-wrap gap-1">
                        {manager.services.primaryNeeds.map((need, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Wyróżnienia</h4>
                      <div className="flex flex-wrap gap-1">
                        {manager.verification.badges.map((badge, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-warning/10 text-warning">
                            <Award className="h-3 w-3 mr-1" />
                            {badge}
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
                      <div className="font-medium text-sm">{manager.contactInfo.phone}</div>
                      <div className="text-xs text-muted-foreground">Telefon</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{manager.contactInfo.email}</div>
                      <div className="text-xs text-muted-foreground">Email</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{manager.contactInfo.address}</div>
                      <div className="text-xs text-muted-foreground">Adres</div>
                    </div>
                  </div>
                  
                  {manager.contactInfo.website && (
                    <div className="flex items-center space-x-3">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{manager.contactInfo.website}</div>
                        <div className="text-xs text-muted-foreground">Strona</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{manager.contactInfo.contactPerson}</div>
                      <div className="text-xs text-muted-foreground">{manager.contactInfo.position}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="properties" className="space-y-4 mt-4">
              {manager.portfolio.managedBuildings.map((building, index) => (
                <Card key={index}>
                  <div className="aspect-video bg-muted rounded-t-lg">
                    <img 
                      src={building.images[0] || '/api/placeholder/400/200'} 
                      alt={building.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base line-clamp-1">{building.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">{building.yearBuilt}</Badge>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="text-xs">{building.address}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-center mb-3">
                      <div>
                        <div className="text-sm font-medium">{building.unitsCount}</div>
                        <div className="text-xs text-muted-foreground">Lokali</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{building.type}</div>
                        <div className="text-xs text-muted-foreground">Typ</div>
                      </div>
                    </div>
                    {building.recentProjects.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium mb-2">Ostatnie projekty:</h5>
                        <div className="flex flex-wrap gap-1">
                          {building.recentProjects.slice(0, 2).map((project, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {project}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="services" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Zarządzanie nieruchomościami</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Kompleksowe zarządzanie {manager.organizationType === 'wspólnota' ? 'wspólnotą mieszkaniową' : 
                                           manager.organizationType === 'spółdzielnia' ? 'spółdzielnią mieszkaniową' :
                                           'nieruchomościami'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-success">
                      {manager.financials.averageProjectBudget}
                    </span>
                    <Button size="sm">Zapytaj</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Zarządzanie projektami</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Nadzór nad remontami i inwestycjami
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-success">
                      {manager.stats.averageProjectDuration}
                    </span>
                    <Button size="sm">Zapytaj</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Obsługa administracyjna</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {manager.financials.budgetPreferences}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-success">
                      Wycena indywidualna
                    </span>
                    <Button size="sm">Zapytaj</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-4">
              {manager.reviews.map((review, index) => (
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
                        <p className="text-xs text-muted-foreground mb-1">Odpowiedź organizacji:</p>
                        <p className="text-sm">{review.response}</p>
                      </div>
                    )}
                    {review.projectBudget && (
                      <div className="mt-2">
                        <span className="text-xs text-success font-medium">Budżet: {review.projectBudget}</span>
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

  // List view - show all managers
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
          <h1 className="text-xl font-semibold">Zarządcy</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold mb-2">Zarządcy nieruchomości</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Znajdź profesjonalnego zarządcę dla swojej nieruchomości
            </p>
          </div>

          {mockManagers.map((manager) => {
            const getOrganizationTypeLabel = (type: string) => {
              switch(type) {
                case 'wspólnota': return 'Wspólnota';
                case 'spółdzielnia': return 'Spółdzielnia';
                case 'zarządca': return 'Zarządca';
                case 'deweloper': return 'Deweloper';
                case 'tbs': return 'TBS';
                case 'administracja': return 'Administracja';
                default: return 'Organizacja';
              }
            };

            return (
              <Card 
                key={manager.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedManagerId(manager.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={manager.avatar} alt={manager.name} />
                      <AvatarFallback>{manager.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h3 className="font-medium text-sm line-clamp-1">
                            {manager.name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {getOrganizationTypeLabel(manager.organizationType)} • {manager.services.primaryNeeds.slice(0, 2).join(', ')}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="text-xs font-medium">{manager.rating.overall}</span>
                              <span className="text-xs text-muted-foreground">
                                ({manager.rating.reviewsCount})
                              </span>
                            </div>
                            <Separator orientation="vertical" className="h-3" />
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {manager.location.city}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          {manager.verification.status === 'verified' && (
                            <Badge variant="secondary" className="bg-success/10 text-success text-xs px-2 py-0">
                              ✓
                            </Badge>
                          )}
                          {(manager.organizationType === 'deweloper' || manager.organizationType === 'zarządca') && (
                            <Badge variant="default" className="text-xs px-2 py-0">
                              PRO
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Building className="h-3 w-3" />
                            <span>{manager.managedProperties.buildingsCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{manager.managedProperties.unitsCount}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Zobacz profil
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};