import React, { useState } from 'react';
import { MapPin, Clock, Eye, ArrowLeft, Users, Calendar, Shield, Phone, Mail, Building } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import TrustIndicators from './TrustIndicators';
import { formatBudget } from '../types/budget';
import type { Budget } from '../types/budget';

interface JobDetailsProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    skills: string[];
    postedTime: string;
    applications: number;
    visits_count?: number;
    bookmarks_count?: number;
    verified: boolean;
    urgent: boolean;
    companyInfo?: {
      id: string;
      logo_url: string | null;
      is_verified: boolean;
    };
    clientType?: string;
    category?: string;
    subcategory?: string;
    isPremium?: boolean;
    hasInsurance?: boolean;
    completedJobs?: number;
    certificates?: string[];
    deadline?: string;
    budget?: Budget | string; // Accept Budget object or string for backward compatibility
    projectDuration?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    buildingType?: string;
    buildingYear?: number;
    surface?: string;
    additionalInfo?: string;
    managementCompany?: string;
    managementContact?: string;
    managementPhone?: string;
    managementEmail?: string;
  };
  onBack?: () => void;
}

export default function JobDetails({ job, onBack }: JobDetailsProps) {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold">{job.title}</h1>
          <p className="text-gray-600 mt-1">{job.company} • {job.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={job.companyInfo?.logo_url || undefined} />
                    <AvatarFallback>{job.company.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{job.title}</h2>
                    <TrustIndicators
                      verified={job.verified}
                      isPremium={job.isPremium}
                      hasInsurance={job.hasInsurance}
                      certificates={job.certificates}
                      visits_count={job.visits_count}
                      bookmarks_count={job.bookmarks_count}
                      completedJobs={job.completedJobs}
                      clientType={job.clientType}
                      urgent={job.urgent}
                      showAll={true}
                      isContractorView={false}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Key Information */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Lokalizacja</p>
                    <p className="font-medium">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Typ zlecenia</p>
                    <p className="font-medium">{job.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-medium">💰</span>
                  <div>
                    <p className="text-sm text-gray-500">Wynagrodzenie</p>
                    <p className="font-medium text-green-600">{job.salary}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Oferty</p>
                    <p className="font-medium">{job.applications}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="details">Szczegóły</TabsTrigger>
                  <TabsTrigger value="requirements">Wymagania</TabsTrigger>
                  <TabsTrigger value="building">Budynek</TabsTrigger>
                  <TabsTrigger value="company">O kliencie</TabsTrigger>
                </TabsList>
                
                <div className="p-6">
                  <TabsContent value="details" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Opis zlecenia</h3>
                      <p className="text-gray-700 leading-relaxed">{job.description}</p>
                    </div>
                    
                    {job.responsibilities && job.responsibilities.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Zakres prac</h3>
                        <ul className="space-y-1">
                          {job.responsibilities.map((resp, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-gray-700">{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {job.additionalInfo && (
                      <div>
                        <h3 className="font-semibold mb-2">Dodatkowe informacje</h3>
                        <p className="text-gray-700">{job.additionalInfo}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="requirements" className="space-y-4">
                    {job.requirements && job.requirements.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Wymagania</h3>
                        <ul className="space-y-1">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-gray-700">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Charakterystyka nieruchomości</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <Badge key={index} variant="outline">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="building" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.buildingType && (
                        <div>
                          <p className="text-sm text-gray-500">Typ budynku</p>
                          <p className="font-medium">{job.buildingType}</p>
                        </div>
                      )}
                      {job.buildingYear && (
                        <div>
                          <p className="text-sm text-gray-500">Rok budowy</p>
                          <p className="font-medium">{job.buildingYear}</p>
                        </div>
                      )}
                      {job.surface && (
                        <div>
                          <p className="text-sm text-gray-500">Powierzchnia</p>
                          <p className="font-medium">{job.surface}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Kategoria</p>
                        <p className="font-medium">{job.category}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="company" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Informacje o kliencie</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{job.company}</span>
                        </div>
                        {job.contactPerson && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>Osoba kontaktowa: {job.contactPerson}</span>
                          </div>
                        )}
                        {job.contactPhone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{job.contactPhone}</span>
                          </div>
                        )}
                        {job.contactEmail && (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{job.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {job.managementCompany && (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="font-semibold mb-2">Firma zarządzająca</h3>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span>{job.managementCompany}</span>
                          </div>
                          {job.managementContact && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span>Zarządca: {job.managementContact}</span>
                            </div>
                          )}
                          {job.managementPhone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{job.managementPhone}</span>
                            </div>
                          )}
                          {job.managementEmail && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{job.managementEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Apply Section */}
          <Card>
            <CardContent className="p-6">
              <Button className="w-full mb-4" size="lg">
                Złóż Ofertę
              </Button>
              <Button variant="outline" className="w-full mb-4">
                Zapisz zlecenie
              </Button>
              <div className="text-center text-sm text-gray-500">
                <p>{job.applications} firm złożyło oferty</p>
                <p className="mt-1">Opublikowano {job.postedTime}</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {(job.deadline || job.projectDuration) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Harmonogram</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {job.deadline && (
                  <div>
                    <p className="text-sm text-gray-500">Termin realizacji</p>
                    <p className="font-medium">{job.deadline}</p>
                  </div>
                )}
                {job.projectDuration && (
                  <div>
                    <p className="text-sm text-gray-500">Czas realizacji</p>
                    <p className="font-medium">{job.projectDuration}</p>
                  </div>
                )}
                {job.budget && (
                  <div>
                    <p className="text-sm text-gray-500">Budżet</p>
                    <p className="font-medium text-green-600">
                      {typeof job.budget === 'object' ? formatBudget(job.budget) : job.budget}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Trust and Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Bezpieczeństwo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Klient zweryfikowany</span>
                <Badge variant={job.verified ? "secondary" : "outline"}>
                  {job.verified ? "Tak" : "Nie"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">System ocen</span>
                <Badge variant="secondary">Dostępny</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bezpieczne płatności</span>
                <Badge variant="secondary">Escrow</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}